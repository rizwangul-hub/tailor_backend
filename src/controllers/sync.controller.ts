import { Request, Response } from 'express';
import { LicenseModel } from '../models/License.model';
import {
  CustomerCloudModel,
  MeasurementCloudModel,
  OrderCloudModel,
  LedgerCloudModel,
  SyncOperationLogModel,
} from '../models/CloudEntity.model';

const verifyDeviceSession = async (tenantId: string, deviceId: string): Promise<boolean> => {
  const license = await LicenseModel.findOne({ tenantId });
  if (!license) return true; // If offline/dev mode without DB record yet
  return license.activeDeviceId === deviceId;
};

export const pushSync = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId, deviceId, changes, payloads } = req.body;

    if (!tenantId || !deviceId) {
      res.status(400).json({ success: false, message: 'Tenant ID and Device ID are required.' });
      return;
    }

    const isValidSession = await verifyDeviceSession(tenantId, deviceId);
    if (!isValidSession) {
      res.status(403).json({ success: false, isRevoked: true, message: 'This license is active on another device.' });
      return;
    }

    const syncedOperationIds: string[] = [];
    const changeList = Array.isArray(changes) ? changes : [];
    const payloadMap: Record<string, any> = payloads || {};

    for (const change of changeList) {
      const { syncOperationId, entityType, entityId, operation } = change;
      if (!syncOperationId || !entityType || !entityId) continue;

      // Idempotency check: Skip already processed sync operations
      const existingLog = await SyncOperationLogModel.findOne({ syncOperationId });
      if (existingLog) {
        syncedOperationIds.push(syncOperationId);
        continue;
      }

      const itemPayload = payloadMap[entityId] || change.payload;

      if (entityType === 'customer' && itemPayload) {
        if (operation === 'delete') {
          await CustomerCloudModel.updateOne(
            { tenantId, id: entityId },
            { $set: { deletedAt: itemPayload.deletedAt || new Date().toISOString() } }
          );
        } else {
          await CustomerCloudModel.updateOne(
            { tenantId, id: entityId },
            { $set: { ...itemPayload, tenantId } },
            { upsert: true }
          );
        }
      } else if (entityType === 'measurement' && itemPayload) {
        if (operation === 'delete') {
          await MeasurementCloudModel.updateOne(
            { tenantId, id: entityId },
            { $set: { deletedAt: itemPayload.deletedAt || new Date().toISOString() } }
          );
        } else {
          const payloadToSave = { ...itemPayload, tenantId };
          if (typeof payloadToSave.values === 'object' && payloadToSave.values !== null) {
            payloadToSave.values = JSON.stringify(payloadToSave.values);
          }
          if (typeof payloadToSave.options === 'object' && payloadToSave.options !== null) {
            payloadToSave.options = JSON.stringify(payloadToSave.options);
          }

          await MeasurementCloudModel.updateOne(
            { tenantId, id: entityId },
            { $set: payloadToSave },
            { upsert: true }
          );
        }
      } else if (entityType === 'order' && itemPayload) {
        if (operation === 'delete') {
          await OrderCloudModel.updateOne(
            { tenantId, id: entityId },
            { $set: { deletedAt: itemPayload.deletedAt || new Date().toISOString() } }
          );
        } else {
          const payloadToSave = { ...itemPayload, tenantId };
          if (typeof payloadToSave.measurementSnapshot === 'object' && payloadToSave.measurementSnapshot !== null) {
            payloadToSave.measurementSnapshot = JSON.stringify(payloadToSave.measurementSnapshot);
          }

          await OrderCloudModel.updateOne(
            { tenantId, id: entityId },
            { $set: payloadToSave },
            { upsert: true }
          );
        }
      } else if (entityType === 'ledger_transaction' && itemPayload) {
        if (operation === 'delete') {
          await LedgerCloudModel.updateOne(
            { tenantId, id: entityId },
            { $set: { deletedAt: itemPayload.deletedAt || new Date().toISOString() } }
          );
        } else {
          await LedgerCloudModel.updateOne(
            { tenantId, id: entityId },
            { $set: { ...itemPayload, tenantId } },
            { upsert: true }
          );
        }
      }

      // Log successful sync operation for idempotency
      await SyncOperationLogModel.create({
        syncOperationId,
        tenantId,
        entityType,
        entityId,
        operation,
        processedAt: new Date(),
      });

      syncedOperationIds.push(syncOperationId);
    }
    
    // Update lastSyncAt
    await LicenseModel.updateOne({ tenantId }, { $set: { lastSyncAt: new Date() } });

    res.status(200).json({
      success: true,
      processedCount: syncedOperationIds.length,
      syncedOperationIds,
      serverTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[PushSync Controller] Error:', error);
    res.status(500).json({ success: false, message: 'Push sync failed on server.' });
  }
};

export const pullSync = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId, deviceId, lastSyncAt } = req.body;

    if (!tenantId || !deviceId) {
      res.status(400).json({ success: false, message: 'Tenant ID and Device ID are required.' });
      return;
    }

    const isValidSession = await verifyDeviceSession(tenantId, deviceId);
    if (!isValidSession) {
      res.status(403).json({ success: false, isRevoked: true, message: 'This license is active on another device.' });
      return;
    }

    const dateFilter = lastSyncAt ? { updatedAt: { $gt: lastSyncAt } } : {};
    const queryFilter = { tenantId, ...dateFilter };

    const customers = await CustomerCloudModel.find(queryFilter);
    const measurements = await MeasurementCloudModel.find(queryFilter);
    const orders = await OrderCloudModel.find(queryFilter);
    const ledgerTransactions = await LedgerCloudModel.find(queryFilter);

    res.status(200).json({
      success: true,
      customers,
      measurements,
      orders,
      ledgerTransactions,
      serverTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[PullSync Controller] Error:', error);
    res.status(500).json({ success: false, message: 'Pull sync failed on server.' });
  }
};

export const restoreTenantData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId, deviceId } = req.body;

    if (!tenantId || !deviceId) {
      res.status(400).json({ success: false, message: 'Tenant ID and Device ID are required.' });
      return;
    }

    const isValidSession = await verifyDeviceSession(tenantId, deviceId);
    if (!isValidSession) {
      res.status(403).json({ success: false, isRevoked: true, message: 'This license is active on another device.' });
      return;
    }

    // Tenant Isolation: Only fetch records belonging strictly to tenantId
    const customers = await CustomerCloudModel.find({ tenantId, deletedAt: null });
    const measurements = await MeasurementCloudModel.find({ tenantId, deletedAt: null });
    const orders = await OrderCloudModel.find({ tenantId, deletedAt: null });
    const ledgerTransactions = await LedgerCloudModel.find({ tenantId, deletedAt: null });

    res.status(200).json({
      success: true,
      customers,
      measurements,
      orders,
      ledgerTransactions,
      serverTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[RestoreTenantData Controller] Error:', error);
    res.status(500).json({ success: false, message: 'Restore failed on server.' });
  }
};
