import z from "zod";

export const deliverySchema = z.object({
  destinationLat: z.number().optional(),
  destinationLon: z.number().optional(),
  destinationAddress: z.string().optional(),
  originLat: z.number().optional(),
  originLon: z.number().optional(),
  originAddress: z.string().optional(),
  duration: z.number().optional(),
  distance: z.number().optional(),
  route: z.array(z.array(z.number())).optional(),
  dispatcherCurrentLocation: z.string(),
  isStarted: z.boolean(),
  itemsToDeliver: z
    .array(
      z.object({
        itemName: z.string(),
        itemPrice: z.number().optional(),
        isPaid: z.boolean().optional(),
        amountDue: z.number().optional(),
      })
    )
    .optional(),
});

export const ItemSchema = z.array(
  z.object({
    name: z.string(),
    price: z.number(),
    isPaid: z.boolean(),
    amountDue: z.number(),
    quantity: z.number(),
  })
);

export type DeliveryType = z.infer<typeof deliverySchema>;
export type Item = z.infer<typeof ItemSchema>;
export type StartedDeliveryType = DeliveryType & {
  startTime: number;
  trackingId: string;
  arrivalTime: number;
};
