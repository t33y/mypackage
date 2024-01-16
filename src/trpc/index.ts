import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./trpc";
import { MongoClient, ObjectId } from "mongodb";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { ItemsSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
// import { Delivery, getDistance } from "@/lib/utils";

export const appRouter = router({
  createDelivery: publicProcedure
    .input(
      z.object({
        destinationLat: z.number().optional(),
        destinationLon: z.number().optional(),
        destinationAddress: z.string().optional(),
        pickupLat: z.number().optional(),
        pickupLon: z.number().optional(),
        pickupAddress: z.string().optional(),
        duration: z.number().optional(),
        distance: z.number().optional(),
        dispatcherPhone: z.string().optional(),
        dispatcherName: z.string().optional(),
        route: z.array(z.array(z.number())).optional(),
        itemsTotalCost: z.number().optional(),
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
      })
    )
    .mutation(async ({ input, ctx }) => {
      const {
        destinationAddress,
        destinationLat,
        destinationLon,
        pickupAddress,
        pickupLat,
        pickupLon,
        dispatcherName,
        dispatcherPhone,
        distance,
        duration,
        route,
      } = input;
      // const distance = getDistance(dispatcher, destination);
      // const speed = 20;
      // const duration = Math.ceil((distance / speed) * 3600000);
      const userId = ctx.session?.user?.id;
      const receiverCode = Math.floor(Math.random() * 500);

      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");
      const delivery = await db.collection("delivery").insertOne({
        destinationAddress,
        destinationLat,
        destinationLon,
        pickupAddress,
        pickupLat,
        pickupLon,
        distance,
        duration,
        route,
        receiverCode,
        vehicle: "Bike",
        dispatcherPhone,
        dispatcherName,
        userId,
        isStarted: false,
        isActivated: false,
        isEnded: false,
        rejected: false,
        completed: false,
        confirmed: false,
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
  activateDelivery: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const trackingId = randomUUID();
      const userId = new ObjectId(ctx.session.user.id);

      const { id } = input;

      const _id = new ObjectId(id);
      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");
      // const durationData = await db.collection("delivery").findOne(
      //   { _id },
      //   {
      //     projection: {
      //       duration: 1,
      //       _id: 0,
      //     },
      //   }
      // );
      // const duration = durationData?.duration;
      // const arrivalTime = startTime / 1000 + duration;

      const user = await db.collection("users").findOne(
        { _id: userId },
        {
          projection: {
            myBank: 1,
          },
        }
      );

      const bonus = parseInt(user?.myBank.bonus) - 300;
      const withdrawable = user?.myBank.withdrawable;
      const balance = bonus + parseInt(withdrawable);
      await db.collection("users").updateOne(
        { _id: userId },
        {
          $set: {
            myBank: { balance, withdrawable, bonus },
          },
        }
      );
      await db.collection("delivery").updateOne(
        { _id },
        {
          $set: {
            trackingId,
            userId,
            isActivated: true,
          },
        }
      );
      await client.close();
      // revalidatePath("/components/navbar.tsx");
      return trackingId;
    }),
  trackDelivery: publicProcedure.input(z.string()).query(async ({ input }) => {
    if (!input) return;

    const client = await MongoClient.connect(process.env.MONGODB_URI as string);
    const db = client.db("mypackage");
    const data = await db
      .collection("delivery")
      .findOne({ trackingId: input }, { projection: { _id: 0 } });
    await client.close();

    // const response = data as Delivery;
    return data;
  }),
  startDelivery: protectedProcedure
    .input(
      z.object({
        trackingId: z.string().optional(),
        durationToPickup: z.number().optional(),
        distanceToPickup: z.number().optional(),
        routeToPickup: z.array(z.array(z.number())).optional(),
        dispatcherCurrentLocation: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      if (!input.trackingId) return;
      const {
        routeToPickup,
        durationToPickup,
        distanceToPickup,
        dispatcherCurrentLocation,
      } = input;
      const startedAt = Date.now();

      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");
      const deliveryToStart = await db
        .collection("delivery")
        .findOne({ trackingId: input.trackingId }, { projection: { _id: 0 } });

      if (!deliveryToStart) return "Delivery does not exist";
      const deliveryDuration = deliveryToStart.duration;
      const duration = deliveryDuration + durationToPickup;
      const deliveryRoute = deliveryToStart.route;
      const route = [...(routeToPickup ?? []), ...deliveryRoute];
      const deliveryDistance = deliveryToStart.distance;
      const distance = Number(deliveryDistance) + Number(distanceToPickup);

      await db.collection("delivery").updateOne(
        { trackingId: input.trackingId },
        {
          $set: {
            distance,
            route,
            duration,
            routeToPickup,
            durationToPickup,
            distanceToPickup,
            startedAt,
            isStarted: true,
            dispatcherCurrentLocation,
          },
        }
      );
      const data = await db
        .collection("delivery")
        .findOne({ trackingId: input.trackingId }, { projection: { _id: 0 } });
      await client.close();

      // const response = data as Delivery;
      return data;
    }),
  getDispatcherDeliveries: protectedProcedure
    .input(z.object({ dispatcherId: z.string().optional() }))
    .query(async ({ input }) => {
      if (!input.dispatcherId) return;

      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");
      const data = await db
        .collection("delivery")
        .find({ dispatcherPhone: input.dispatcherId })
        .toArray();
      await client.close();

      return data;
    }),
  getUserDeliveries: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ input }) => {
      if (!input.userId) return [];
      const id = new ObjectId(input.userId);
      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");
      const data = await db
        .collection("delivery")
        .find({ userId: id })
        .toArray();
      await client.close();

      return data;
    }),
  updateDispatcherLocation: protectedProcedure
    .input(
      z.object({
        phone: z.string(),
        dispatcherCurrentLocation: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const { phone, dispatcherCurrentLocation } = input;
      const lastSeen = Date.now();
      let updateIsOnline;
      if (updateIsOnline) {
        clearTimeout(updateIsOnline);
      }
      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");
      await db
        .collection("users")
        .updateOne(
          { phone },
          { $set: { dispatcherCurrentLocation, isOnline: true, lastSeen } }
        );
      await db
        .collection("delivery")
        .updateOne(
          { dispatcherPhone: phone },
          { $set: { dispatcherCurrentLocation } }
        );
      await client.close();

      updateIsOnline = setTimeout(async () => {
        const client = await MongoClient.connect(
          process.env.MONGODB_URI as string
        );
        const db = client.db("mypackage");

        await db
          .collection("users")
          .updateOne({ phone }, { $set: { isOnline: false } });
        await client.close();
        revalidatePath("/components/dispatcherdata");
      }, 600000);
    }),
  updateDelivery: publicProcedure
    .input(
      z.object({
        id: z.string(),
        items: ItemsSchema.optional(),
        vehicle: z.string().optional(),
        vehicleLicense: z.string().optional(),
        deliveryCost: z.string().optional(),
        itemsTotalCost: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const {
        id,
        items,
        vehicle,
        vehicleLicense,
        deliveryCost,
        itemsTotalCost,
      } = input;
      const deliveryId = new ObjectId(id);

      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");
      const data = await db.collection("delivery").updateOne(
        { _id: deliveryId },
        {
          $set: {
            items,
            vehicle,
            vehicleLicense,
            deliveryCost,
            itemsTotalCost,
          },
        }
      );
      await client.close();
    }),
  endDelivery: publicProcedure
    .input(
      z.object({
        trackingId: z.string(),
        rejected: z.boolean().optional(),
        receiverCode: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { trackingId, rejected, receiverCode } = input;

      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");

      if (!ctx.session?.user) {
        if (!receiverCode) return "Please enter Correct Receiver code";
        const code = await db
          .collection("delivery")
          .findOne({ trackingId }, { projection: { receiverCode: 1 } });
        console.log(code);
        if (!code || code.receiverCode !== receiverCode) {
          await client.close();
          return "Please enter Correct Receiver code";
        }
      }
      const endedAt = Date.now();

      await db.collection("delivery").updateOne(
        { trackingId },
        {
          $set: {
            isStarted: false,
            isEnded: true,
            rejected,
            isActivated: false,
            endedAt,
            dispatcherCurrentLocation: null,
          },
        }
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

      return data;
    }),
  signUp: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        password: z.string().optional(),
        isDispatcher: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { name, email, isDispatcher, phone, password } = input;
      if (isDispatcher && !phone) return "Please fill all required fields";
      if (!isDispatcher && !email) return "Please fill all required fields";
      if (!password) return;
      const hashPassword = bcrypt.hash(password, 10);
      const bonus = 3000;
      const withdrawable = 0;
      const myBank = { balance: bonus + withdrawable, bonus, withdrawable };

      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");

      const registeredEmail = await db.collection("users").findOne({ email });

      const registeredNumber = await db.collection("users").findOne({ phone });

      if (registeredEmail || registeredNumber) {
        return "Credentials already exist";
      }

      const data = await db
        .collection("users")
        .insertOne({ name, email, isDispatcher, phone, hashPassword, myBank });
      await client.close();
      return data;
    }),
  getUserById: protectedProcedure
    .input(z.string().optional())
    .query(async ({ input }) => {
      if (!input) return null;
      const id = new ObjectId(input);
      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");
      const user = await db.collection("users").findOne({ _id: id });
      await client.close();
      return user;
    }),
  getUserByPhone: protectedProcedure
    .input(z.string().optional())
    .query(async ({ input }) => {
      if (!input) return null;

      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");
      const user = await db.collection("users").findOne({ phone: input });
      await client.close();
      return user;
    }),
  getDispatcherByPhone: publicProcedure
    .input(z.string().optional())
    .query(async ({ input }) => {
      if (!input) return null;

      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );
      const db = client.db("mypackage");
      const user = await db.collection("users").findOne(
        { phone: input },
        {
          projection: {
            name: 1,
            isOnline: 1,
            image: 1,
            phone: 1,
            email: 1,
            lastSeen: 1,
          },
        }
      );
      await client.close();
      return user;
    }),
});

export type AppRouter = typeof appRouter;
