import React, { useEffect } from "react";
import { useStore, useDispatch } from "../modules/context";
import { LOAD_USER } from "../modules/actions";
import styles from "./Home.module.css";

export function Home() {
  const { dispatch } = useDispatch();
  const { store } = useStore();

  useEffect(() => {
    setInterval(async () => {
      const user = await askMain("info-request", "user", "profile").then(
        (user) => {
          dispatch({
            type: LOAD_USER,
            user,
          });
          // ipc.send("start-client", Date.now().toString());
        }
      );
    }, 3e3);
  }, []);

  return <div className={styles.homeWrapper}>{JSON.stringify(store.user)}</div>;
}
