import { reactive, effect } from "@wfatec/reactivity";

const userInfo = reactive({
    name: "chao",
    age: 29
})

effect(() => {
    console.log("The new name is :", userInfo.name)
})

effect(() => {
    console.log("The new age is :", userInfo.age)
})

userInfo.age = 30;
userInfo.name = "wfatec";