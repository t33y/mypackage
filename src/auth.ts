import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import { AuthOptions, DefaultSession, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";
import clientPromise from "./mongodb";
import { Adapter } from "next-auth/adapters";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      myBank: {
        balance: number;
        bonus: number;
        withdrawable: number;
      };
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    myBank: {
      balance: number;
      bonus: number;
      withdrawable: number;
    };
    isDispatcher: boolean;
    //   // ...other properties
    //   // role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      // profile: (profile: GoogleProfile) => {
      //   return {
      //     id: profile.sub,
      //     name: profile.name,
      //     email: profile.email,
      //     image: profile.picture,
      //     myBank: {
      //       balance: 3000,
      //       bonus: 3000,
      //       withdrawable: 0,
      //     },
      //     isDispatcher: false,
      //   };
      // },
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email or Phone number",
          type: "text",
        },
        passwordEmail: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        console.log("credential", credentials);
        if (!credentials?.email || !credentials?.passwordEmail) {
          throw new Error("Please provide valid credentials");
        }
        const client = await MongoClient.connect(
          process.env.MONGODB_URI as string
        );

        const db = client.db();
        if (credentials.email.includes("@")) {
          const user = await db
            .collection("users")
            .findOne({ email: credentials.email });

          await client.close();
          if (user) {
            return user as any;
          } else {
            return null;
          }
        } else {
          const user = await db
            .collection("users")
            .findOne({ phone: credentials.email });
          console.log("user is", user);
          await client.close();
          if (user) {
            return user as any;
          } else {
            return null;
          }
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt: async ({ token, isNewUser }) => {
      const client = await MongoClient.connect(
        process.env.MONGODB_URI as string
      );

      const db = client.db();

      const db_user = await db
        .collection("users")
        .findOne({ email: token?.email });

      if (db_user) {
        token.id = db_user._id.toString();
      }
      if (isNewUser) {
        if (!db_user?.myBank) {
          const bonus = 3000;
          const withdrawable = 0;
          await db.collection("users").updateOne(
            { email: token.email },
            {
              $set: {
                myBank: { balance: bonus + withdrawable, bonus, withdrawable },
                isDispatcher: false,
              },
            }
          );
        }
      }

      client.close();
      return token;
    },
    // session: ({ session, user }) => {
    //   return {
    //     ...session,
    //     user: {
    //       ...session.user,
    //       id: user.id.toString(),
    //       myBank: user.myBank,
    //     },
    //   };
    // },
    session: ({ session, token }) => {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }
      return session;
    },
  },

  adapter: MongoDBAdapter(clientPromise) as Adapter,
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};
export const getAuthSession = () => {
  return getServerSession(authOptions);
};
