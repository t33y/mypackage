"use client";
import MapComponent from "@/components/MapComponent";
import { trpcClient } from "@/trpc/client";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
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
type DeliveryStartData = {
  id: string;
  dispatcherCode: string;
};

const API_KEY = "AIzaSyAlaaYarlEwGAEC5hPKq4PdEN9w1KRgLRk";

export default function Delivery({ params: { id } }: Props) {
  // const session = useSession();
  // if (!session.data?.user) {
  //   redirect("/signup");
  // }
  const [items, setItem] = useState<Array<Item>>([]);
  const [isCodeSet, setIsCodeSet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryStartData, setDeliveryStartData] = useState<DeliveryStartData>(
    { id, dispatcherCode: "" }
  );
  const itemNameRef = useRef<HTMLInputElement>(null);
  const itemPriceRef = useRef<HTMLInputElement>(null);
  const itemQuantityRef = useRef<HTMLInputElement>(null);
  const setDispatcherCodeRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const { data } = trpcClient.getDelivery.useQuery({ id });
  const { mutate } = trpcClient.startDelivery.useMutation();

  const setDispatcherCode = () => {
    if (!setDispatcherCodeRef.current?.value) {
      return alert("Please set a dispatcher code");
    }

    let ref = setDispatcherCodeRef.current.value;

    setDeliveryStartData((prev) => {
      return { ...prev, dispatcherCode: ref };
    });

    setDispatcherCodeRef.current.value = "";
    setIsCodeSet(true);
  };
  const addItem = () => {
    const name = itemNameRef.current?.value;
    const price = itemPriceRef.current?.value;
    const quantity = itemQuantityRef.current?.value;
    setItem([...items, { name, price, quantity }]);
  };
  const startDelivery = () => {
    if (!deliveryStartData.dispatcherCode) {
      alert("set dispatcher code");
      console.log(
        "delievery start data dispatch code",
        deliveryStartData.dispatcherCode
      );
      return;
    }
    setIsLoading(true);
    mutate(deliveryStartData, {
      onSuccess: (e) => {
        console.log("Delivery started", e);
        // return redirect(`/delivery/${e.insertedId}`);
        router.push(`http://localhost:3000/track/${e}`);
      },
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none"></div>
      </div>

      {data && (
        <MapComponent
          originLat={data.originLat}
          originLon={data.originLon}
          route={data.route}
          routeName={`Navigate to ${data.destinationAddress}`}
          destinationLat={data.destinationLat}
          destinationLon={data.destinationLon}
        />
      )}
      {/* <input
        className="text-black my-2"
        ref={setDispatcherCodeRef}
        placeholder="set dispatcher code"
        type="text"
      />
      <button
        className="border p-2 flex justify-center my-2 rounded-md"
        onClick={setDispatcherCode}
      >
        {" "}
        Send Delivery to Dispatcher
      </button> */}
      <input
        className="text-black my-2"
        ref={setDispatcherCodeRef}
        placeholder="set dispatcher code"
        type="text"
      />
      <button
        className="border p-2 flex justify-center my-2 rounded-md"
        onClick={setDispatcherCode}
      >
        {" "}
        Set Dispatcher Code
      </button>

      <button
        disabled={!isCodeSet}
        onClick={startDelivery}
        className="border p-2 flex w-32 justify-center rounded-md"
      >
        {isLoading ? (
          <div className="h-5 w-5 border-t-2 rounded-full animate-spin border-white"></div>
        ) : (
          "Start delivery"
        )}
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
