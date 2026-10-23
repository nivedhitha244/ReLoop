import mongoose from 'mongoose';

const BuyerRequestSchema = new mongoose.Schema(
  {
    requestCode: {
      type: String,
      required: true,
      unique: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    buyerName: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    waterCategory: {
      type: String,
      required: true,
    },
    requiredQuantity: {
      type: Number,
      required: true,
      min: [1, 'Required quantity must be at least 1 litre'],
    },
    fulfilledQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    purpose: {
      type: String,
      required: true,
    },
    intendedUse: {
      type: String,
      default: '',
    },
    indicativeBudget: {
      type: String,
      default: '₹0.15/L',
    },
    maxBudgetPerLitre: {
      type: Number,
      default: 0.15,
    },
    deliveryLocation: {
      address: { type: String, default: 'Chennai, Tamil Nadu' },
      coordinates: {
        type: [Number], // [lat, lng]
        required: true,
      },
    },
    requiredDate: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    priority: {
      type: String,
      enum: ['Standard', 'High', 'Urgent'],
      default: 'Standard',
    },
    requiredQuality: {
      type: String,
      enum: ['Standard', 'Verified', 'Certified'],
      default: 'Verified',
    },
    status: {
      type: String,
      enum: ['Active', 'Pending', 'Partially Matched', 'Matched', 'Accepted', 'Confirmed', 'In Transit', 'Fulfilled', 'Completed', 'Cancelled'],
      default: 'Active',
    },
    statusColor: {
      type: String,
      default: 'green',
    },
    matchingStatus: {
      type: String,
      enum: ['Unmatched', 'In Review', 'Approved', 'Dispatched', 'Matched', 'Confirmed', 'Completed'],
      default: 'Unmatched',
    },
  },
  {
    timestamps: true,
  }
);

BuyerRequestSchema.index({ status: 1, matchingStatus: 1 });

export const BuyerRequest = mongoose.models.BuyerRequest || mongoose.model('BuyerRequest', BuyerRequestSchema);
