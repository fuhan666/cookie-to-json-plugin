import { useEffect, useState } from "react";
import Cookie2Json from "./Cookie2Json";

export default function App() {
  const [enterAction, setEnterAction] = useState({});
  const [route, setRoute] = useState("");

  useEffect(() => {
    window.utools.onPluginEnter((action) => {
      setRoute(action.code);
      setEnterAction(action);
    });
    window.utools.onPluginOut((isKill) => {
      setRoute("");
    });
  }, []);

  if (route === "convert") {
    return <Cookie2Json enterAction={enterAction} />;
  }

  return false;
}
