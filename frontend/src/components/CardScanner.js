import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Alert } from "react-native";
import { useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import { Camera } from "react-native-vision-camera-ocr-plus";
import { parseCardData } from "../utils/cardParser";

export default function CardScanner({ onScanComplete, onClose }) {
  const [isActive, setIsActive] = useState(true);
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    if (!hasPermission) {
      requestPermission().then((granted) => {
        if (!granted) {
          Alert.alert("Permission Denied", "Camera access is required to scan cards.");
          onClose();
        }
      });
    }
  }, [hasPermission]);

  const accumulatedData = React.useRef({ cardNumber: null, expiry: null, name: null });
  const timeoutRef = React.useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleOcrResult = (data) => {
    if (!isActive || !data || !data.blocks) return;

    // Convert new format to match what our parser expects (objects with a .text property)
    const blocks = data.blocks.map(b => ({ text: b.blockText }));
    const parsed = parseCardData(blocks);
    
    // Accumulate the best data we've found across multiple frames
    if (parsed.cardNumber && !accumulatedData.current.cardNumber) {
      accumulatedData.current.cardNumber = parsed.cardNumber;
    }
    if (parsed.expiry && !accumulatedData.current.expiry) {
      accumulatedData.current.expiry = parsed.expiry;
    }
    if (parsed.name && !accumulatedData.current.name) {
      accumulatedData.current.name = parsed.name;
    }

    // If we have a card number...
    if (accumulatedData.current.cardNumber) {
      // If we also found the expiry, we have everything we strictly need, so finish immediately.
      if (accumulatedData.current.expiry) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsActive(false);
        onScanComplete(accumulatedData.current);
      } 
      // Otherwise, give the scanner 2 seconds to try and find the expiry/name before giving up.
      else if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          setIsActive(false);
          onScanComplete(accumulatedData.current);
        }, 2000);
      }
    }
  };

  if (!hasPermission) return <View style={styles.container} />;
  if (device == null) return <Text style={styles.errorText}>No Camera Device Found</Text>;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        mode="recognize"
        options={{ language: 'latin', frameSkipThreshold: 5 }}
        callback={handleOcrResult}
      />

      
      <View style={styles.overlay}>
        <View style={styles.guideBox}>
          <Text style={styles.guideText}>Position card within frame</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  errorText: {
    color: "white",
    textAlign: "center",
    marginTop: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  guideBox: {
    width: "85%",
    height: 220,
    borderWidth: 2,
    borderColor: "#00b37e",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 179, 126, 0.1)",
  },
  guideText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  closeBtn: {
    position: "absolute",
    bottom: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  closeBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
