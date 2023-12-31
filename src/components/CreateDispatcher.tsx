import React from "react";
import { Form } from "react-hook-form";

type Props = { dispatcherProvider: string };

const CreateDispatcher = ({ dispatcherProvider }: Props) => {
  return (
    <div>
      <form>
        <div>
          <label htmlFor="dispatcherProvider">Dispatcher Provider</label>
          <input
            type="text"
            id="dispatcherProvider"
            name="dispatcherProvider"
            defaultValue={dispatcherProvider}
          />
        </div>
        <div>
          <label htmlFor="vehicle">Vehicle Type</label>
          <select name="vehicle" id="vehicle">
            <option value="bike">Bike</option>
            <option value="car">Car</option>
            <option value="bike">Bus</option>
          </select>
        </div>

        <div>
          <label htmlFor="license">License Plate Number</label>
          <input type="text" id="license" name="license" />
        </div>
        <div>
          <label htmlFor="dispatcherName">Dispatcher Name</label>
          <input type="text" id="dispatcherName" name="dispatcherName" />
        </div>
        <button type="submit">Create Dispatcher</button>
      </form>
    </div>
  );
};

export default CreateDispatcher;
