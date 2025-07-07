import ReactLoading from "react-loading";

interface LoadingTypes {
  blank;
  balls;
  bars;
  bubbles;
  cubes;
  cylon;
  spin;
  spinningBubbles;
  spokes;
}

const LoadingWidget = ({
  type = "bubbles",
  color = localStorage.getItem("appPrimaryColor") ?? "grey",
  width = 60,
  height = 60
}: {
  type?: keyof LoadingTypes;
  color?: string;
  width?: number;
  height?: number;
}) => <ReactLoading type={type} color={color} height={height} width={width} />;

export default LoadingWidget;
