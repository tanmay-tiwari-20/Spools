import { Button } from "@chakra-ui/react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <Link to={"/tanmay"}>
      <div className="flex w-full justify-center">
        <Button mx={"auto"}>Visit Profile Page</Button>
      </div>
    </Link>
  );
};

export default HomePage;
