import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema(
  {
    matchCode: {
      type: String,
      required: true,
      unique: true,
    },
    sourceId: {
      type: String,
      required: true,
    },
    sourceName: {
      type: String,
      required: true,
    },
    demandId: {
      type: String,
      required: true,
    },
    destinationName: {
      type: String,
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupplierListing',
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BuyerRequest',
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Matched quantity must be at least 1 litre'],
    },
    distanceKm: {
      type: Number,
      required: true,
      default: 0,
    },
    waterCategory: {
      type: String,
      default: 'Treated Wastewater',
    },
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 85,
    },
    scoreFactors: {
      proximityScore: { type: Number, default: 80 },
      quantityScore: { type: Number, default: 90 },
      qualityScore: { type: Number, default: 95 },
      urgencyScore: { type: Number, default: 80 },
      reasons: [{ type: String }],
    },
    status: {
      type: String,
      enum: ['Proposed', 'Accepted', 'Scheduled', 'Confirmed', 'Matched', 'Admin Approved', 'In Transit', 'Rejected', 'Overridden', 'In Delivery', 'Completed', 'Cancelled'],
      default: 'Proposed',
    },
    qualityVerified: {
      type: Boolean,
      default: true,
    },
    approvalNotes: {
      type: String,
      default: '',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedByName: {
      type: String,
      default: '',
    },
    approvedAt: {
      type: Date,
    },
    isOverridden: {
      type: Boolean,
      default: false,
    },
    overrideReason: {
      type: String,
      default: '',
    },
    overriddenBy: {
      type: String,
      default: '',
    },
    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
    },
  },
  {
    timestamps: true,
  }
);

MatchSchema.index({ status: 1 });
MatchSchema.index({ sourceId: 1, demandId: 1 });

export const Match = mongoose.models.Match || mongoose.model('Match', MatchSchema);
