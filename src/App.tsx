import { NavigationContainer } from "@react-navigation/native";
import DemoStack from "./navigators/DemoStack";

export default function App() {

  return (
    <NavigationContainer>
      <DemoStack />
    </NavigationContainer>
  )
}