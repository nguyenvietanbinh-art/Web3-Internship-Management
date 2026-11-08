const mongoose = require('mongoose');
const { HttpError } = require('../utils/http');
const { verifyDatabaseIdentity } = require('./databaseSafety');

// QR/GPS and encrypted uploads are database operations, not blockchain writes.
// Recheck live cloud identity before mutations; never provision a marker here.
async function assertBusinessWriteEnvironment(env = process.env, connection = mongoose.connection) {
  try {
    if (connection.readyState !== 1) throw Error('Database disconnected');
    if (env.APP_ENV === 'CLOUD_DEMO') {
      require('../config/cloudDemoPolicy').configuration(env);
      await verifyDatabaseIdentity(env, connection);
      return;
    }
    if (env.APP_ENV) throw Error('Unsupported environment');
    if (env.SCHOOL_WORKFLOW_ENABLED === 'true') {
      const expected = require('../config/workflowTestGuard').assertWorkflowTest(env);
      if (connection.name !== expected.database ||
          (await connection.db.command({ hello: 1 })).setName !== expected.replicaSet) throw Error('TEST database mismatch');
    } else {
      const uri = require('../config/testDatabaseGuard').assertTestEnvironment({
        nodeEnv: env.NODE_ENV, uri: env.MONGODB_URI, allowlistedUri: env.MONGODB_URI_TEST_ALLOWLIST,
      });
      if (connection.name !== new URL(uri).pathname.slice(1)) throw Error('TEST database mismatch');
    }
  } catch {
    throw new HttpError(503, 'Môi trường ghi dữ liệu chưa được xác minh; chưa thực hiện thao tác.', 'BUSINESS_ENVIRONMENT_REJECTED');
  }
}

module.exports = { assertBusinessWriteEnvironment };
