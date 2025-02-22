import { StyleSheet } from "react-native";

const LoginStyles = StyleSheet.create({
  gradient: {
    flex: 1,  // Takes full screen height
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 40,
    fontFamily: 'PlusJakartaSans-Bold',  // Note the quotes and exact name
  },
});

export default LoginStyles;
