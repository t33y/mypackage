import { z } from "zod";
import { publicProcedure, router } from "./trpc";
import { MongoClient, ObjectId } from "mongodb";
import { randomUUID } from "crypto";
import { getDistance } from "@/lib/utils";

export const appRouter = router({
  createDelivery: publicProcedure
    .input(
      z.object({
        dispatcher: z.string(),
        destination: z.string(),
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
      const { dispatcher, destination } = input;
      const distance = getDistance(dispatcher, destination);
      const speed = 20;
      const duration = Math.ceil((distance / speed) * 3600000);

      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");
      const delivery = await db.collection("delivery").insertOne({
        dispatcher,
        destination,
        dispatchCurrentLocation: dispatcher,
        isStarted: false,
        distance,
        duration,
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
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const trackingId = randomUUID();
      const startTime = Date.now();

      const { id } = input;
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
      const arrivalTime = startTime + duration;
      console.log("duration", duration);
      console.log("arrival", arrivalTime);
      await db
        .collection("delivery")
        .updateOne(
          { _id },
          { $set: { trackingId, arrivalTime, startTime, isStarted: true } }
        );
      await client.close();
      return trackingId;
    }),
  trackDelivery: publicProcedure.input(z.string()).query(async ({ input }) => {
    const client = await MongoClient.connect(process.env.MONGODB_URI as string);
    const db = client.db("mypackage");
    const data = await db
      .collection("delivery")
      .findOne({ trackingId: input }, { projection: { _id: 0 } });
    await client.close();
    return data;
  }),
});

export type AppRouter = typeof appRouter;
