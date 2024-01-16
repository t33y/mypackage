import React from "react";
import { deliverySchema } from "@/lib/schemas";
import { z } from "zod";

type DeliveryType = z.infer<typeof deliverySchema>;

type Props = { delivery?: DeliveryType };

const DeliveryData = ({ delivery }: Props) => {
  if (!delivery) return null;
  return (
    <div className="flex flex-col gap-3 p-4 border rounded-lg ">
      {!delivery.isActivated && (
        <div className="text-red-600">Delivery is not activated.</div>
      )}
      {delivery.isActivated && delivery.isStarted ? (
        <div className="text-green-600">
          Dispatcher has Started the delivery
        </div>
      ) : (
        <div className="text-red-600">
          Dispatcher has NOT Started the delivery
        </div>
      )}
      <div>
        <div className="font-bold">From:</div> {delivery.pickupAddress}
      </div>
      <div>
        <div className="font-bold">To:</div> {delivery.destinationAddress}
      </div>
      {!!delivery.trackingId && (
        <div>
          <div className="font-bold">Tracking ID:</div> {delivery.trackingId}
        </div>
      )}
      <div>
        <span className="font-bold">Dispatcher Contact:</span>{" "}
        {delivery.dispatcherPhone}{" "}
      </div>
      <div>
        <span className="font-bold">Receiver Code:</span>{" "}
        {delivery.receiverCode}{" "}
      </div>
      <div>
        <span className="font-bold">Vehicle type:</span> {delivery.vehicle}{" "}
      </div>
      {delivery.vehicleLicense && (
        <div>
          <span className="font-bold">Vehicle License:</span>{" "}
          {delivery.vehicleLicense}
        </div>
      )}
      {delivery.items && delivery.items.length > 0 && (
        <div>
          <div className="font-bold">Items to deliver</div>
          {delivery.items.map((item, i) => {
            return (
              <div className="flex text-left gap-5" key={item.itemId}>
                <span>{i + 1}.</span> <span>{item.itemName}</span>{" "}
                <span>₦{item.itemPrice}</span> <span>{item.itemQuantity}</span>{" "}
                <span>₦{item.itemSubTotal}</span>
              </div>
            );
          })}
          <div>
            {!!delivery.deliveryCost && (
              <div>
                <span className="font-bold">Delivery Fee:</span>{" "}
                {delivery.deliveryCost}
              </div>
            )}
          </div>
          <span className="font-bold">Total: </span>
          {delivery.deliveryCost && delivery.itemsTotalCost
            ? delivery.itemsTotalCost + parseInt(delivery.deliveryCost)
            : delivery.itemsTotalCost}
        </div>
      )}
    </div>
  );
};

export default DeliveryData;
