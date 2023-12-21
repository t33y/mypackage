"use client";
import { trpcClient } from "@/trpc/client";

type Props = {
  params: {
    tracker: string;
  };
};

const API_KEY = "djjdhnsdhkdjsd";

export default function Track({ params: { tracker } }: Props) {
  const { data } = trpcClient.trackDelivery.useQuery(tracker);
  const start = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
    hour12: true,
  }).format(data?.startTime);
  const end = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
    hour12: true,
  }).format(data?.arrivalTime);

  const duration = data?.duration ?? 120 / 3600000;
  const remainderTime = data?.arrivalTime ?? 1 - Date.now();

  const remainderHr =
    remainderTime > 3600000 ? Math.round(remainderTime % 12) : 0;
  const remainderMin =
    remainderTime > 60000 ? Math.round(remainderTime % 60) : 0;
  const remainderSec =
    remainderTime > 1000 ? Math.round(remainderTime % 60) : 0;

  const ETA = `${remainderHr}hr:${remainderMin}min:${remainderSec}sec`;

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
      {/* {JSON.stringify(data)} */}

      <div className="gap-2 flex">
        <label htmlFor="destination">Destination</label>
        <input
          className="text-black"
          id="destination"
          value={data?.destination}
        />
      </div>
      <div className="gap-2 flex">
        <label htmlFor="dispatcher">Pick up </label>
        <input
          className="text-black"
          id="dispatcher"
          value={data?.dispatcher}
          // {...form.register("dispatcher")}
        />
      </div>
      <div className=" justify-between border w-1/2 flex">
        <label htmlFor="dispatcher">Start time </label>
        <input
          className="text-black w-1/2"
          id="dispatcher"
          value={start}

          // {...form.register("dispatcher")}
        />
      </div>
      <div className=" justify-between border w-1/2  flex">
        <label htmlFor="dispatcher">Arrival time </label>
        <input className="text-black w-1/2" id="dispatcher" value={end} />
      </div>
      <div className="gap-2 flex">
        <label htmlFor="duration">Duration </label>
        <input className="text-black" id="duration" value={`${duration} hrs`} />
      </div>
      <div className="gap-2 flex">
        <label htmlFor="dispatcher">Distance </label>
        <input
          className="text-black"
          id="dispatcher"
          value={`${data?.distance}Km`}
        />
      </div>
      <div className="gap-2 flex">
        <label htmlFor="dispatcher">Estimated time to left </label>
        <input className="text-black" id="dispatcher" value={ETA} />
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left"></div>
    </main>
  );
}
