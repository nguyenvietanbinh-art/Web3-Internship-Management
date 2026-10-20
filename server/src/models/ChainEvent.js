const mongoose = require("mongoose");

const ChainEventSchema = new mongoose.Schema({
  eventName: { type: String, required: true, trim: true },
  blockNumber: { type: Number, required: true, min: 0 },
  txHash: { type: String, required: true, lowercase: true, match: /^0x[a-f0-9]{64}$/ },
  logIndex: { type: Number, required: true, min: 0 },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  processed: { type: Boolean, default: false, index: true },
}, { timestamps: true, collection: "chain_events" });

ChainEventSchema.index({ txHash: 1, logIndex: 1 }, { unique: true });

module.exports = mongoose.model("ChainEvent", ChainEventSchema);
