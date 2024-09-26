import { atom } from "recoil";

const authScreenAtom = atom({
    key: "authScreenAtom",
    default: 'login', // Default value when the atom is created
})

export default authScreenAtom;