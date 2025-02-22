import React from "react";
import { TouchableOpacity, Text, Image, StyleSheet } from "react-native";

const CustomButton = ({ title, onPress, icon, backgroundColor, textColor }) => (
  <TouchableOpacity
    style={[styles.button, { backgroundColor }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    {icon && <Image source={icon} style={styles.icon} />}
    <Text style={[styles.text, { color: textColor }]}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 10,
    resizeMode: "contain",
  },
  text: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
  }
});

export default CustomButton;
