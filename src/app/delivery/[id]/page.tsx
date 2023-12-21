"use client";
import { trpcClient } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Props = {
  params: {
    id: string;
  };
};

type Item = {
  name: string | undefined;
  price: string | undefined;
  quantity: string | undefined;
};

const API_KEY = "AIzaSyAlaaYarlEwGAEC5hPKq4PdEN9w1KRgLRk";

export default function Delivery({ params: { id } }: Props) {
  const [items, setItem] = useState<Array<Item>>([]);
  const itemNameRef = useRef<HTMLInputElement>(null);
  const itemPriceRef = useRef<HTMLInputElement>(null);
  const itemQuantityRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { data } = trpcClient.getDelivery.useQuery({ id });
  const { mutate } = trpcClient.startDelivery.useMutation();
  const addItem = () => {
    const name = itemNameRef.current?.value;
    const price = itemPriceRef.current?.value;
    const quantity = itemQuantityRef.current?.value;
    setItem([...items, { name, price, quantity }]);
  };
  const startDelivery = () => {
    mutate(
      { id },
      {
        onSuccess: (e) => {
          console.log("Delivery started", e);
          // return redirect(`/delivery/${e.insertedId}`);
          router.push(`http://localhost:3000/track/${e}`);
        },
      }
    );
  };

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

      <button onClick={startDelivery} className="border rounded-md">
        Start delivery
      </button>
      <div className="gap-2">
        Update delivery
        {/* {JSON.stringify(data)} */}
        <form className="text-blue-700 space-y-2 ">
          <div className="flex flex-col gap-4">
            Dispatcher
            <div className="gap-2 flex">
              <label htmlFor="Reg">Dispatcher Name</label>
              <input type="text" id="Reg" />
            </div>
            <div className="gap-2 flex">
              <label htmlFor="type">Vehicle type</label>
              <select id="type">
                <option value="bike">Bike</option>
                <option value="car">Car</option>
              </select>
              <div className="gap-2 flex">
                <label htmlFor="location"> Dispatcher current location</label>
                <input type="text" id="location" />
              </div>
            </div>
            <div className="gap-2 flex">
              <label htmlFor="colour"> Vehicle Colour</label>
              <input type="text" id="colour" />
            </div>
            <div className="gap-2 flex">
              <label htmlFor="cost">Estimated Delivery Cost</label>
              <input type="text" id="cost" />
            </div>
          </div>
          Order
          <div>
            <div className="flex  gap-4">
              <div className="gap-2 flex">
                <label htmlFor="name">Item Name</label>
                <input ref={itemNameRef} type="text" id="name" />
              </div>
              <div className="gap-2 flex">
                <label htmlFor="price">Price</label>
                <input ref={itemPriceRef} type="number" id="price" />
              </div>
              <div className="gap-2 flex">
                <label htmlFor="quantity">Quantity</label>
                <input ref={itemQuantityRef} type="number" id="quantity" />
              </div>
              <button onClick={addItem} type="button">
                Add Item
              </button>
            </div>
            {items.map((item) => {
              return (
                <div
                  key={`${item.name}${item.quantity}${item.price}`}
                  className="flex  gap-4"
                >
                  <div className="gap-2 flex">
                    <label htmlFor={item.name}>Item Name</label>
                    <input value={item.name} type="text" id={item.name} />
                  </div>
                  <div className="gap-2 flex">
                    <label htmlFor={`${item.price}${item.name}`}>Price</label>
                    <input value={item.price} type="number" id={item.price} />
                  </div>
                  <div className="gap-2 flex">
                    <label htmlFor={`${item.quantity}${item.name}`}>
                      Quantity
                    </label>
                    <input
                      value={item.quantity}
                      type="number"
                      id={`${item.name}${item.quantity}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <button>Update delivery</button>
        </form>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left"></div>
    </main>
  );
}
