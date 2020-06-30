import { reactive, effect } from "@wfatec/reactivity";

const userInfo = reactive({
    name: "chao",
    age: 29
})

effect(() => {
    console.log("The new userInfo is :", userInfo.age)
})

userInfo.age = 30;