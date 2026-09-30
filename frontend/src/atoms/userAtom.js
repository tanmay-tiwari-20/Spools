import { atom } from "recoil";

const getInitialUser = () => {
  try {
    const item = localStorage.getItem("user-spools");
    if (!item || item === "undefined" || item === "null") {
      return null;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error("Corrupted user session in localStorage, clearing:", error);
    localStorage.removeItem("user-spools");
    return null;
  }
};

const userAtom = atom({
  key: "userAtom",
  default: getInitialUser(),
});

export default userAtom;
