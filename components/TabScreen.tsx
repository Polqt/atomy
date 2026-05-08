import { type ReactNode } from 'react';
import { StatusBar, StyleSheet, View, type StatusBarStyle, type StyleProp, type ViewStyle } from 'react-native';
import colors from '@/constants/colors';
import TabBar from '@/components/TabBar';

type TabScreenProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  statusBarColor?: string;
  statusBarStyle?: StatusBarStyle;
};

export default function TabScreen({
  children,
  style,
  statusBarColor = colors.background,
  statusBarStyle = 'dark-content',
}: TabScreenProps) {
  return (
    <View style={[styles.root, { backgroundColor: statusBarColor }, style]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={statusBarColor} />
      {children}
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

