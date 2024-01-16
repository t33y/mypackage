import z from "zod";

export const deliverySchema = z.object({
  _id: z.string(),
  receiverCode: z.number().optional(),
  startedAt: z.date().optional(),
  durationToPickup: z.number().optional(),
  distanceToPickup: z.number().optional(),
  routeToPickup: z.array(z.array(z.number())).optional(),
  selected: z.boolean().optional(),
  trackingId: z.string().optional(),
  destinationLat: z.number().optional(),
  destinationLon: z.number().optional(),
  destinationAddress: z.string().optional(),
  pickupLat: z.number().optional(),
  pickupLon: z.number().optional(),
  pickupAddress: z.string().optional(),
  duration: z.number().optional(),
  distance: z.number().optional(),
  dispatcherPhone: z.string().optional(),
  route: z.array(z.array(z.number())).optional(),
  itemsTotalCost: z.number().optional(),
  isStarted: z.boolean(),
  isEnded: z.boolean(),
  isActivated: z.boolean(),
  rejected: z.boolean(),
  completed: z.boolean(),
  confirmed: z.boolean(),
  vehicle: z.string().optional(),
  vehicleLicense: z.string().optional(),
  deliveryCost: z.string().optional(),
  items: z
    .array(
      z.object({
        itemName: z.string(),
        itemPrice: z.number().optional(),
        itemQuantity: z.number().optional(),
        itemSubTotal: z.number().optional(),
        itemId: z.string().optional(),
      })
    )
    .optional(),
});

export const deliveriesSchema = z.array(deliverySchema);

export const ItemsSchema = z.array(
  z.object({
    itemName: z.string(),
    itemPrice: z.number(),
    itemId: z.string(),
    itemSubTotal: z.number(),
    itemQuantity: z.number(),
  })
);

export type DeliveryType = z.infer<typeof deliverySchema>;
export type Items = z.infer<typeof ItemsSchema>;
export type StartedDeliveryType = DeliveryType & {
  startTime: number;
  trackingId: string;
  arrivalTime: number;
};
