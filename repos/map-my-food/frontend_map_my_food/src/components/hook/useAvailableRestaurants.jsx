import AvailablerestaurantsData from "../TemporaryData/AvailableRestaurantsData.json";
import { useLocationLocalStorage } from "./LocationLocalStorage";

const useAvailableRestaurants = () => {
  const { fetchPincode } = useLocationLocalStorage();
  const pincode = fetchPincode();
  const AvailableRestaurantsData = async () => {
    const data = await fetch(
      `${
        import.meta.env.VITE_REACT_BACKEND_URL
      }/availablerestaurants/${pincode}`
    )
      .then((response) => {
        return response.json();
      })
      .catch((err) => {
        return AvailablerestaurantsData;
      });
    return data;
  };
  return { AvailableRestaurantsData };
};

export default useAvailableRestaurants;
