"use client";
import { Delivery } from "@/lib/utils";
import { trpcClient } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const API_KEY = "AIzaSyAlaaYarlEwGAEC5hPKq4PdEN9w1KRgLRk";

export default function Home() {
  const [originLocation, setOriginLocation] = useState("");
  const router = useRouter();
  const form = useForm<Delivery>({
    defaultValues: {
      destination: " ",
      dispatcher: originLocation,
    },
  });

  const { mutate: createDelivery } = trpcClient.createDelivery.useMutation();

  const onSubmit = async (data: {
    dispatcher: string;
    destination: string;
  }) => {
    data.dispatcher = originLocation;
    createDelivery(data, {
      onSuccess: (e) => {
        console.log("Deliveries Created", e);
        // return redirect(`/delivery/${e.insertedId}`);
        router.push(`http://localhost:3000/delivery/${e.insertedId}`);
      },
    });
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setOriginLocation(`${pos.coords.latitude},${pos.coords.longitude}`);
      });
    } else {
      alert(
        "Geolocation is NOT supported by this browser :( make sure your GPS is turned on"
      );
    }
  }, []);
  form.watch();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none"></div>
      </div>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]"></div>
      <iframe
        width="600"
        height="450"
        style={{ border: 0 }}
        loading="lazy"
        // allowfullscreen
        // referrerpolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps/embed/v1/place?key=${API_KEY}
    &q=Space+Needle,Seattle+WA`}
      ></iframe>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
        <div className="gap-2 flex">
          <label htmlFor="destination">Add Destination</label>
          <input
            className="text-black"
            {...form.register("destination")}
            id="destination"
          />
        </div>
        <div className="gap-2 flex">
          <label htmlFor="dispatcher">Dispatcher </label>
          <input
            className="text-black"
            onChange={(e) => {
              setOriginLocation(e.target.value);
            }}
            id="dispatcher"
            type="text"
            value={originLocation}
            // {...form.register("dispatcher")}
          />
        </div>
        <button type="submit" className="border rounded-md">
          Create a delivery
        </button>
      </form>
      {/* <button onClick={()=>console.log(createDelivery(data))} className="border rounded-md">
          Create a delivery
        </button> */}

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left"></div>
    </main>
  );
}
