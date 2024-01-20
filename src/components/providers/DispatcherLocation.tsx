import { trpcClient } from "@/trpc/client";
import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useState,
} from "react";

type DispatcherContextType = {
  dispatcherLocationState: number[];
  setDispatcherLocationState: React.Dispatch<React.SetStateAction<number[]>>;
};

const dispatcherLocationContext = createContext<DispatcherContextType | null>(
  null
);
const DispatcherLocationProvider = ({ children }: PropsWithChildren) => {
  const [dispatcherLocationState, setDispatcherLocationState] = useState<
    number[]
  >([]);

  return (
    <dispatcherLocationContext.Provider
      value={{ dispatcherLocationState, setDispatcherLocationState }}
    >
      {children}
    </dispatcherLocationContext.Provider>
  );
};

export default DispatcherLocationProvider;

export const useDispatcherLocationContext = () => {
  const context = useContext(dispatcherLocationContext);
  if (!context) {
    throw new Error(
      "Please ensure component is within the DispatcherLocationProvider"
    );
  }
  return context;
};
