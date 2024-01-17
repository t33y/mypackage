"use client";
import MapComponent from "@/components/MapComponent";
import { SiWhatsapp } from "react-icons/si";
import { TfiEmail } from "react-icons/tfi";
import { trpcClient } from "@/trpc/client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { RedirectType, redirect, useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import LoadingDelivery from "@/components/LoadingDelivery";
import DeliveryData from "@/components/DeliveryData";
import { deliverySchema } from "@/lib/schemas";
import DispatcherData from "@/components/DispatcherData";

type Props = {
  params: {
    id: string;
  };
};

type Item = {
  itemId: string;
  itemName: string;
  itemPrice: number;
  itemQuantity: number;
  itemSubTotal: number;
};

type Dispatcher = {
  name?: string;
  phone?: string;
  image?: string;
};

export default function Delivery({ params: { id } }: Props) {
  const session = useSession();
  const { data, refetch } = trpcClient.getDelivery.useQuery({ id });

  const delivery = data ? deliverySchema.parse(data) : null;
  // if (!session.data?.user) {
  //   redirect(`/signup?delivery=${id}`, RedirectType.push);
  // }

  const router = useRouter();
  if (session.data) {
    if (data?.userId) {
      if (session.data.user.id !== data?.userId) {
        if (data?.userId) {
          router.push("/");
        }
      }
    }
  }

  const [items, setItems] = useState<Array<Item>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);

  const itemNameRef = useRef<HTMLInputElement>(null);
  const itemPriceRef = useRef<HTMLInputElement>(null);
  const itemQuantityRef = useRef<HTMLInputElement>(null);

  const { mutate: activate } = trpcClient.activateDelivery.useMutation();
  const { mutate: endCurrentDelivery } = trpcClient.endDelivery.useMutation();
  const { mutate: updateCurrentDelivery } =
    trpcClient.updateDelivery.useMutation();

  const addItem = () => {
    if (
      !itemPriceRef.current ||
      !itemQuantityRef.current ||
      !itemNameRef.current
    )
      return alert("Please fill all required fields");
    const itemName = itemNameRef.current?.value;
    const itemPrice = parseInt(itemPriceRef.current?.value);
    const itemQuantity = parseInt(itemQuantityRef.current?.value);
    const itemId = `${itemName}${itemPrice}`;
    if (!itemPrice || !itemName || !itemQuantity)
      return alert("Please fill all required fields");
    const isItemExist = items.some((item) => {
      return item.itemId === itemId;
    });
    if (isItemExist) return alert("Item already exist");
    const itemSubTotal = itemPrice * itemQuantity;
    setItems([
      ...items,
      { itemName, itemPrice, itemQuantity, itemId, itemSubTotal },
    ]);
    itemNameRef.current.value = "";
    itemPriceRef.current.value = "";
    itemQuantityRef.current.value = "";
  };

  const itemsTotalCost = useMemo(() => {
    return items.reduce((sum, item) => {
      return (sum += item.itemSubTotal);
    }, 0);
  }, [items]);

  const activateOrEndDelivery = () => {
    setIsLoading(true);
    if (session.status !== "authenticated") {
      router.push(`/signup?delivery=${id}`);
    }
    if (data?.isActivated) {
      endCurrentDelivery(data.trackingId, {
        onSettled: () => {
          refetch();
          setIsLoading(false);
        },
      });
      return;
    }
    if (!data?.isActivated) {
      activate(
        { id },
        {
          onSettled: () => {
            refetch();

            setIsLoading(false);
            router.refresh();
          },
        }
      );
      return;
    }
  };

  const deleteItem = (itemId: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => {
        item.itemId !== itemId;
      })
    );
  };

  const handleUpdateDeliverySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdateLoading(true);
    const formData = new FormData(e.currentTarget);
    const vehicleLicense = formData.get("vehicleLicense") as string;
    const vehicle = formData.get("vehicle") as string;
    const deliveryCost = formData.get("deliveryCost") as string;
    updateCurrentDelivery(
      {
        id,
        items,
        itemsTotalCost,
        vehicleLicense,
        vehicle,
        deliveryCost,
      },
      {
        onSuccess: () => {
          setIsUpdateLoading(false);
          refetch();
          setItems([]);
        },
        onError: () => {
          setIsUpdateLoading(true);
          alert("Something went wrong");
        },
      }
    );
  };
  if (isUpdateLoading) {
    return <LoadingDelivery loader="Updating Delivery" />;
  }

  return (
    <main className="flex min-h-screen flex-col gap-8 items-center justify-between p-24">
      {/* {JSON.stringify(data)} */}
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none"></div>
      </div>

      {data && (
        <MapComponent
          deliveries={[
            {
              pickupLat: data.pickupLat,
              pickupLon: data.pickupLon,
              route: data.route,
              routeName: `Navigate to ${data.destinationAddress}`,
              destinationLat: data.destinationLat,
              destinationLon: data.destinationLon,
            },
          ]}
          dispatcher={{
            vehicle: data.vehicle,
            dispatcherCurrentLocation: data.dispatcherCurrentLoaction,
          }}
        />
      )}
      {data && (
        <button
          className="rounded-md border w-[20%] p-3 flex justify-center items-center "
          onClick={activateOrEndDelivery}
          disabled={data.isEnded}
        >
          {isLoading ? (
            <div className="w-5 h-5 rounded-full animate-spin border-t-2 border-white"></div>
          ) : data.isActivated ? (
            "End Delivery"
          ) : (
            "Activate Delivery"
          )}{" "}
        </button>
      )}
      {data?.isActivated && (
        <div className="flex flex-col gap-5">
          <Link
            className="rounded-md border w-[100%] p-3 flex justify-center items-center"
            href={`${process.env.NEXT_PUBLIC_SERVER_URL}/track/${data.trackingId}/tracking`}
          >
            Track Delivery
          </Link>
          <Link
            href={`https://wa.me/${data?.dispatcherPhone}?text=${process.env.NEXT_PUBLIC_SERVER_URL}/dispatcher/${data?.dispatcherPhone}/${id}`}
            target="_blank"
            className="borde p-2 flex flex-col items-center justify-center my-2 rounded-md"
          >
            <SiWhatsapp /> Send to Dispatcher
          </Link>
        </div>
      )}
      <DispatcherData dispatcherPhone={data?.dispatcherPhone} />
      {delivery && <DeliveryData delivery={delivery} />}

      {data && data?.isActivated && (
        <div className=" p-2 flex flex-col gap-3 items-center justify-center my-2 rounded-md">
          <Link
            href={`https://wa.me/?text=${process.env.NEXT_PUBLIC_SERVER_URL}/track/${data?.trackerId}/tracking`}
            target="_blank"
          >
            <SiWhatsapp />
          </Link>
          <Link
            href={`mailto:?body=${process.env.NEXT_PUBLIC_SERVER_URL}/track/${data?.trackerId}/tracking`}
            target="_blank"
          >
            <TfiEmail />
          </Link>
          Share with customer
        </div>
      )}
      {data && !data.isActivated && (
        <div className="gap-2 mt-10">
          <div className="py-4 flex justify-center item-center font-bold ">
            <p className="flex-grow text-left text-2xl ">Update Delivery</p>{" "}
            <span className="italic font-light  ">Optional</span>{" "}
          </div>
          <form onSubmit={handleUpdateDeliverySubmit} className=" space-y-2 ">
            <p className=" text-left border-b  ">Dispatch Details </p>
            <div className="flex text-blue-700 item-center flex-col gap-4">
              <div className="gap-2 flex">
                <label htmlFor="Reg">License Plate</label>
                <input name="vehicleLicense" type="text" id="Reg" />
              </div>
              <div className="gap-2 flex">
                <label htmlFor="type">Vehicle type</label>
                <select name="vehicle" id="type">
                  <option value="Bike">Bike</option>
                  <option value="Car">Car</option>
                  <option value="Truck">Truck</option>
                </select>
              </div>
              <div className="gap-2 flex">
                <label htmlFor="cost">Estimated Delivery Cost</label>
                <input name="deliveryCost" type="text" id="cost" />
              </div>
            </div>
            <p className=" text-left mt-5 border-b ">Order Details</p>
            <div className="flex text-blue-700 flex-col gap-4">
              <div className="flex  item-center mb-10  gap-4">
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
                <button
                  className="p-2 border rounded-md flex justify-center"
                  onClick={addItem}
                  type="button"
                >
                  Add Item
                </button>
              </div>
              {items.map((item) => {
                return (
                  <div key={item.itemId} className="flex  gap-4">
                    <div className="gap-2 flex">
                      <label>Item Name</label>
                      <input value={item.itemName} type="text" readOnly />
                    </div>
                    <div className="gap-2 flex">
                      <label>Price</label>
                      <input value={item.itemPrice} type="number" readOnly />
                    </div>
                    <div className="gap-2 flex">
                      <label>Quantity</label>
                      <input value={item.itemQuantity} type="number" readOnly />
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteItem(item.itemId)}
                      className="p-2 border rounded-md flex justify-center"
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="submit"
              className="p-2 border rounded-md flex justify-center"
            >
              Update delivery
            </button>
          </form>
        </div>
      )}

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left"></div>
    </main>
  );
}
