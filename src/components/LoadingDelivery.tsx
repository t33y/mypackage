import Image from "next/image";

export default function LoadingDelivery({ loader }: { loader: string }) {
  return (
    <div className=" h-screen grid place-content-center place-items-center ">
      <div className="flex flex-col w-[70%] md:w-[60%] gap-6 justify-center items-center">
        <Image
          width={600}
          height={600}
          alt={"loading delivery"}
          src={"/deliveryloading.gif"}
        />
        <div className="flex gap-3">
          <div className="h-5 w-5 rounded-full animate-spin border-t"></div>{" "}
          {loader}...
        </div>
        {/* <a href="https://storyset.com/business">
        Business illustrations by Storyset
      </a> */}
      </div>
    </div>
  );
}
