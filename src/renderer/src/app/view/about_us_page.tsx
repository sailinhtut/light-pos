import {
  aboutLetter,
  address,
  appDescription,
  appName,
  contactLink,
  latitude,
  longitude,
  phoneOne,
  phoneTwo,
  publisherCompanyName,
  websiteLink,
  youtubeAddress
} from "@renderer/utils/app_constants";
import BreadcrumbContext from "./components/breadcrumb_context";
import appIcon from "../../assets/images/app_icon.png";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import { Phone } from "lucide-react";

export function AboutUsPage() {
  return (
    <div className="p-5 overflow-x-hidden">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "About Us", route: "/settings/about-us" }
        ]}
      />
      <div className="w-[600px]">
        <img src={appIcon} alt="App Icon" className="mt-5 size-[150px] rounded-3xl  border" />
        <p className="mt-2 text-lg font-semibold">{appName}</p>
        <p className="text-slate-500 text-xs font-semibold">
          {publisherCompanyName} • Version 1.0.0
        </p>
        <p className="mt-3 text-justify" style={{ lineHeight: "1.8" }}>
          {aboutLetter}
        </p>

        <p className="mt-5 text-sm font-semibold">Address</p>
        <p
          className="select-none cursor-pointer"
          onClick={() => {
            window.open(`https://www.google.com/maps?q=${latitude},${longitude}`);
          }}
        >
          {address}
        </p>
        <p className="mt-5 text-sm font-semibold">Contact</p>
        <a
          className="text-primary select-none cursor-pointer"
          href={`tel:+${phoneOne}`}
          target="_blank"
        >
          +{phoneOne}
        </a>
        <br></br>
        <a
          className="text-primary select-none cursor-pointer"
          href={`tel:+${phoneTwo}`}
          target="_blank"
        >
          +{phoneTwo}
        </a>
        <p className="mt-5 text-sm font-semibold">More Detail</p>
        <a className="text-primary select-none cursor-pointer" href={websiteLink} target="_blank">
          Visit Light POS
        </a>
        <br></br>
        <a
          className="text-primary select-none cursor-pointer"
          href={youtubeAddress}
          target="_blank"
        >
          Visit Youtube Channel
        </a>
        <br></br>
        <Button
          variant={"outline"}
          className="mt-1 ml-auto flex flex-row text-primary"
          onClick={() => {
            window.open(contactLink);
          }}
        >
          <Phone className="size-5 mr-3" />
          Contact Us
        </Button>
      </div>
    </div>
  );
}
