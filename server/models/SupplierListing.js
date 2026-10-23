import mongoose from 'mongoose';

const SupplierListingSchema = new mongoose.Schema(
  {
    listingCode: {
      type: String,
      required: true,
      unique: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    supplierName: {
      type: String,
      required: true,
    },
    waterCategory: {
      type: String,
      required: true,
      enum: ['Industrial', 'Treated Wastewater', 'RO Reject Water', 'Greywater', 'Stormwater', 'Rainwater'],
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    totalQuantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: [0, 'Available quantity cannot be negative'],
    },
    indicativePrice: {
      type: String,
      default: '₹0.12/L',
    },
    pricePerLitre: {
      type: Number,
      default: 0.12,
    },
    intendedUses: [{
      type: String,
    }],
    location: {
      address: { type: String, default: 'Chennai, Tamil Nadu' },
      coordinates: {
        type: [Number], // [lat, lng]
        required: true,
      },
    },
    availabilityPeriod: {
      startDate: { type: Date, default: Date.now },
      endDate: { type: Date, default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
    },
    qualityVerificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected', 'Expired'],
      default: 'Pending',
    },
    qualityReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QualityReport',
    },
    labReportSummary: {
      reportId: String,
      tester: String,
      ph: Number,
      turbidity: String,
      tds: String,
      expiryDate: String,
    },
    status: {
      type: String,
      enum: ['active', 'moderation_pending', 'suspended', 'depleted', 'expired'],
      default: 'active',
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

SupplierListingSchema.index({ status: 1, qualityVerificationStatus: 1 });
SupplierListingSchema.index({ availableQuantity: 1 });

export const SupplierListing = mongoose.models.SupplierListing || mongoose.model('SupplierListing', SupplierListingSchema);
