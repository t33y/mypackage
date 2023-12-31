import React from "react";

type Props = {};

const SignUp = (props: Props) => {
  return (
    <form>
      <div>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          required
          id="email"
          placeholder="johndoe@example.com"
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input type="password" required id="password" />
      </div>

      <button>Submit</button>
    </form>
  );
};

export default SignUp;
