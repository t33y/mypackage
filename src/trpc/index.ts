import { z } from "zod";
import { publicProcedure, router } from "./trpc";
import { MongoClient, ObjectId } from "mongodb";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
// import { Delivery, getDistance } from "@/lib/utils";

export const appRouter = router({
  createDelivery: publicProcedure
    .input(
      z.object({
        destinationLat: z.number().optional(),
        destinationLon: z.number().optional(),
        destinationAddress: z.string().optional(),
        originLat: z.number().optional(),
        originLon: z.number().optional(),
        originAddress: z.string().optional(),
        duration: z.number().optional(),
        distance: z.number().optional(),
        route: z.array(z.array(z.number())).optional(),
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
      })
    )
    .mutation(async ({ input }) => {
      const {
        destinationAddress,
        destinationLat,
        destinationLon,
        originAddress,
        originLat,
        originLon,
        distance,
        duration,
        route,
      } = input;
      // const distance = getDistance(dispatcher, destination);
      // const speed = 20;
      // const duration = Math.ceil((distance / speed) * 3600000);

      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");
      const delivery = await db.collection("delivery").insertOne({
        destinationAddress,
        destinationLat,
        destinationLon,
        originAddress,
        originLat,
        originLon,
        distance,
        duration,
        route,
        dispatcherCurrentLocation: [originLat, originLon],
        isStarted: false,
        isEnded: false,
      });
      await client.close();
      return delivery;
    }),
  getDelivery: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { id } = input;
      const _id = new ObjectId(id);
      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");
      const data = await db.collection("delivery").findOne({ _id });
      await client.close();
      return data;
    }),
  startDelivery: publicProcedure
    .input(z.object({ id: z.string(), dispatcherCode: z.string() }))
    .mutation(async ({ input }) => {
      const trackingId = randomUUID();
      const startTime = Date.now();

      const { id, dispatcherCode } = input;
      const _id = new ObjectId(id);
      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");
      const durationData = await db.collection("delivery").findOne(
        { _id },
        {
          projection: {
            duration: 1,
            _id: 0,
          },
        }
      );
      const duration = durationData?.duration;
      const arrivalTime = startTime / 1000 + duration;
      console.log("duration", duration);
      console.log("arrival", arrivalTime);
      await db.collection("delivery").updateOne(
        { _id },
        {
          $set: {
            trackingId,
            arrivalTime,
            startTime,
            dispatcherCode,
            isStarted: true,
          },
        }
      );
      await client.close();
      return trackingId;
    }),
  trackDelivery: publicProcedure.input(z.string()).query(async ({ input }) => {
    if (!input) return;
    console.log("the input", input);
    const client = await MongoClient.connect(process.env.MONGODB_URI as string);
    const db = client.db("mypackage");
    const data = await db
      .collection("delivery")
      .findOne({ trackingId: input }, { projection: { _id: 0 } });
    await client.close();

    // const response = data as Delivery;
    return data;
  }),
  confirmDispatcherCode: publicProcedure
    .input(z.object({ code: z.string().optional(), trackingId: z.string() }))
    .query(async ({ input }) => {
      console.log(input.code);
      if (!input.code) return;
      const { code, trackingId } = input;
      console.log("the input", input);
      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");
      const data = await db
        .collection("delivery")
        .findOne({ trackingId }, { projection: { dispatcherCode: 1 } });
      await client.close();
      if (data?.dispatcherCode === code) {
        return true;
      } else {
        return false;
      }
    }),
  updateDispatcherLocation: publicProcedure
    .input(
      z.object({
        trackingId: z.string(),
        dispatcherCurrentLocation: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const { trackingId, dispatcherCurrentLocation } = input;

      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");
      await db
        .collection("delivery")
        .updateOne(
          { trackingId },
          { $set: { trackingId, dispatcherCurrentLocation } }
        );
      await client.close();
    }),
  updateDelivery: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { id } = input;

      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");
      await db
        .collection("delivery")
        .updateOne({ id }, { $set: { isStarted: false } });
    }),
  endDelivery: publicProcedure
    .input(z.object({ trackingId: z.string() }))
    .mutation(async ({ input }) => {
      const { trackingId } = input;

      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");
      await db
        .collection("delivery")
        .updateOne(
          { trackingId },
          { $set: { isStarted: false, isEnded: true } }
        );
    }),
  deleteDelivery: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { id } = input;
      const _id = new ObjectId(id);
      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");
      await db.collection("delivery").deleteOne({ _id });
      return { deleted: id };
    }),
  getDeliveriesStatuses: publicProcedure
    .input(z.array(z.string()))
    .query(async ({ input }) => {
      const ids = input;
      const _ids = ids.map((id) => {
        return new ObjectId(id);
      });
      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");
      const data = await db
        .collection("delivery")
        .find({ _id: { $in: _ids } }, { projection: { isEnded: 1 } })
        .toArray();
      await client.close();
      console.log("data get deliveries", data);
      return data;
    }),
});

export type AppRouter = typeof appRouter;
