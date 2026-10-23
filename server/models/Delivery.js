import mongoose from 'mongoose';

const DeliveryStatusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: String, default: 'System' },
  note: { type: String, default: '' },
});

const DeliverySchema = new mongoose.Schema(
  {
    deliveryCode: {
      type: String,
      required: true,
      unique: true,
    },
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
    },
    sourceName: {
      type: String,
      required: true,
    },
    destinationName: {
      type: String,
      required: true,
    },
    transporterName: {
      type: String,
      default: 'EcoFlow Logistics Fleet',
    },
    transporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    driverName: {
      type: String,
      default: 'K. Rajesh',
    },
    driverPhone: {
      type: String,
      default: '+91 98777 66554',
    },
    vehicleNumber: {
      type: String,
      default: 'TN-09-CW-8492',
    },
    waterCategory: {
      type: String,
      default: 'Treated Wastewater',
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1 litre'],
    },
    status: {
      type: String,
      enum: [
        'Requested',
        'Matched',
        'Scheduled',
        'Confirmed',
        'Quality Cleared',
        'Transporter Assigned',
        'In Transit',
        'Delivered',
        'Completed',
        'Cancelled',
        'Disputed'
      ],
      default: 'Transporter Assigned',
    },
    pickupLocation: {
      name: { type: String, default: 'Source Facility' },
      address: { type: String, default: 'Ambattur Industrial Estate, Chennai' },
      coordinates: { type: [Number], required: true }, // [lat, lng]
    },
    deliveryLocation: {
      name: { type: String, default: 'Buyer Facility' },
      address: { type: String, default: 'Green Park, Chennai' },
      coordinates: { type: [Number], required: true }, // [lat, lng]
    },
    currentLocation: {
      coordinates: { type: [Number], default: [13.0650, 80.2600] },
      updatedAt: { type: Date, default: Date.now },
    },
    routeWaypoints: [
      {
        coordinates: [Number],
        name: String,
      }
    ],
    estimatedDistanceKm: {
      type: Number,
      default: 4.5,
    },
    scheduledPickupTime: {
      type: Date,
      default: Date.now,
    },
    dispatchedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    statusHistory: [DeliveryStatusHistorySchema],
  },
  {
    timestamps: true,
  }
);

DeliverySchema.index({ status: 1 });

export const Delivery = mongoose.models.Delivery || mongoose.model('Delivery', DeliverySchema);
