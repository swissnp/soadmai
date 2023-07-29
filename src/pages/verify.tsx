/* eslint-disable @typescript-eslint/no-unsafe-call */
import { api } from "~/utils/api";
import type { GetServerSidePropsContext } from "next";
import { getServerAuthSession } from "~/server/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type IVerificationEmail,
  VerificationEmailSchema,
} from "~/utils/validator/userInput";
import { useSession, signOut } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { prisma } from "~/server/db";
export default function Verify({
  isLogin,
  verifySuccess,
  haveToken,
}: {
  isLogin: boolean;
  verifySuccess: boolean;
  haveToken: boolean;
}) {
  console.log({ isLogin, verifySuccess, haveToken });
  const router = useRouter();
  const { data: sessionData } = useSession();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid, isSubmitting },
  } = useForm<IVerificationEmail>({
    resolver: zodResolver(VerificationEmailSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
    },
  });
  const { mutate } = api.verify.sendVerificationEmail.useMutation({
    onSuccess: () => {
      if (document) {
        (document.getElementById("my_modal_1") as HTMLFormElement).showModal();
      }
    },
    onError: (error) => {
      setError("email", { message: error.message });
    },
  });
  // email form with submit button
  return (
    <>
      <Head>
        <title>soad mai?</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </Head>
      <dialog id="my_modal_1" className="modal">
        <form method="dialog" className="modal-box">
          <h3 className="text-lg font-bold">Verification Email Sent!</h3>
          <p className="py-4">
            {
              "We have sent you a verification email. Please check your inbox or junk box and click on the link to verify your email."
            }
          </p>
          <div className="modal-action">
            <button
              className="btn"
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={async (e) => {
                e.preventDefault();
                await router.push("/");
              }}
            >
              Close
            </button>
          </div>
        </form>
      </dialog>
      <main className="flex min-h-screen flex-col items-center justify-center">
        {isLogin && (
          <div
            className="btn absolute right-5 top-5"
            onClick={() => {
              void signOut({ callbackUrl: "/" });
            }}
          >
            logout
          </div>
        )}
        <div className="container flex flex-col items-center justify-center gap-6 px-4 py-16 sm:gap-12  ">
          <h6 className="text-3xl font-extrabold tracking-tight text-secondary-content sm:py-4 sm:text-[4rem]">
            <span className="text-[#8e0e19] delay-75 duration-300 ease-in-out">
              {`${sessionData?.user?.name ?? ""} `}
            </span>
            <span className="delay-75 duration-300 ease-in-out hover:text-[#8e0e19]">
              {"soad "}
            </span>
            <span className="delay-75 duration-300 ease-in-out hover:text-[#8e0e19]">
              mai?
            </span>
          </h6>
          {verifySuccess === false && haveToken === true && (
            <div className="grid w-full grid-rows-1 items-center gap-5 font-bold sm:w-96 sm:justify-center">
              <p className="text-center text-2xl font-extrabold text-error">
                Verification Failed
              </p>
            </div>
          )}
          {verifySuccess === true && (
            <div className="grid w-full grid-rows-1 items-center gap-5 font-bold sm:w-96 sm:justify-center">
              <p className="text-center text-2xl font-extrabold text-success">
                Verification Success
              </p>
            </div>
          )}
          {isLogin === true && verifySuccess === false && (
            <div className="grid w-full grid-rows-1 items-center gap-5 font-bold sm:w-96 sm:justify-center">
              <p className="text-center font-normal">
                To confirm that you are chula student, please enter your chula
                email.
              </p>
              <div className="form-control ">
                <label className="label text-lg">
                  <span className="label-text text-base">
                    Enter your chula email
                  </span>
                </label>
                <input
                  className="input input-bordered w-full sm:w-96"
                  placeholder="example@student.chula.ac.th"
                  {...register("email")}
                ></input>
                {
                  <label className="label pb-0">
                    <span className="label-text-alt pb-0 text-red-500">
                      {errors.email?.message}
                    </span>
                  </label>
                }
              </div>
              <button
                className={`btn ${
                  !isValid || isSubmitting ? "btn-disabled" : "btn-primary"
                } ${isSubmitting && "loading loading-spinner"}}`}
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onClick={handleSubmit((data: { email: string }) => {
                  mutate(data);
                })}
              >
                Send verification email
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerAuthSession(context);
  if (!context.query.token || typeof context.query.token !== "string") {
    if (!session?.user) {
      return {
        redirect: {
          destination: "/",
          permanent: true,
        },
      };
    }
    return {
      props: {
        verifySuccess: false,
        isLogin: !!session?.user,
        haveToken: false,
      },
    };
  }

  const verification = await prisma.verificationToken.findFirst({
    where: {
      token: context.query.token,
    },
    select: {
      identifier: true,
    },
  });
  if (!verification && !session?.user) {
    return {
      redirect: {
        destination: "/",
        permanent: true,
      },
    };
  }
  if (!verification) {
    return {
      props: {
        verifySuccess: false,
        isLogin: !!session?.user,
        haveToken: true,
      },
    };
  }

  const verifyUser = await prisma.user.update({
    where: {
      email: verification.identifier,
    },
    data: {
      emailVerified: {
        set: new Date(),
      },
    },
  });

  if (!verifyUser && !session?.user) {
    return {
      redirect: {
        destination: "/",
        permanent: true,
      },
    };
  }
  if (!verifyUser) {
    return {
      props: {
        verifySuccess: false,
        isLogin: !!session?.user,
        haveToken: true,
      },
    };
  }

  await prisma.verificationToken.delete({
    where: {
      token: context.query.token,
    },
  });
  return {
    props: {
      verifySuccess: true,
      isLogin: !!session?.user,
      haveToken: true,
    },
  };
}
