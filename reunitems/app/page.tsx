import Image from "next/image";
import { Button } from "@/components/Button";

export default function Home() {
  return (
    <div className="bg-bg-blue min-h-screen">
      <main>
        <div 
          className="w-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/assets/banner.png')" }}
        >
          <div 
            className="flex flex-col items-start gap-4 pt-2 pb-8"
            style={{
              background: "linear-gradient(to right, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0) 100%)"
            }}
          >
            <h1 className="text-8xl sm:text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem] font-bold px-8 py-4 rounded-lg"> 
              ReunItems 
            </h1>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl ml-2 font-bold">
              Find your lost items on your local campus.
            </h1>

            <p className="ml-5 text-2xl mb-4">
              Lost something important? Found an item that belongs to someone else? You're in the right place.
            </p>
            
            <div className="flex space-x-4 ml-5 mr-5 items-center w-full">
              <Button 
                variant="primary" 
                href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                color1="#5f9cff"
                color2="#1e40af"
              >
                Find Your School
              </Button>
              
              <Button
                variant="primary" 
                href="https://hack.club"
                color1="#8b5cf6"
                color2="#7c3aed"
              >
                Sign Up Your School Lost&Found
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 ml-5 mr-5 mt-8">
          <div className="lg:w-[55%] w-full">
            <h3 className="font-bold text-3xl mt-4">Lost something important? Found an item that belongs to someone else? You're in the right place.</h3>
            <p className="text-3xl mt-4">Our smart lost and found platform makes it easier than ever to recover lost belongings and return found items to their rightful owners. Whether you dropped your keys on campus, left your laptop in a coffee shop, or found someone's wallet – we're here to help reconnect people with their possessions.</p>
          </div>
          <div className="lg:w-[45%] w-full">
            <div className="w-full h-[300px] lg:h-[400px] overflow-hidden">
              <Image 
                src="/assets/lostandfound.png"
                alt="Lost and Found Illustration"
                width={800} 
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 ml-5 mr-5 mt-8">
          <div className="lg:w-[55%] w-full">
            <h3 className="font-bold text-3xl mt-4">How It Works:</h3>
            <p className="text-2xl mt-4">Lost Something?: Search our database of found items, submit a detailed claim with photos for proof of ownership, and get notified when there's a match. Our smart search even recognizes common misspellings, so you won't miss your item because of a typo.</p>
            <p className="text-2xl mt-4">Found Something?: Quickly report found items with photos and descriptions. Good Samaritans like you help make our community a better place – we'll handle connecting items with their owners.</p>
            <p className="text-2xl mt-4">
              Why Choose Us?
              Smart Search Technology | Map Features | Photo Verification | Admin-Verified Process | Multi-Platform Access | Simple UI
            </p>
          </div>
          <div className="lg:w-[45%] w-full">
            <div className="w-full h-[300px] lg:h-[400px] overflow-hidden">
              <Image 
                src="/assets/findschool.png"
                alt="Lost and Found Illustration" 
                width={800} 
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
          <h1 className="text-5xl text-bold mt-8 ml-5 mr-5 mb-8 text-center">Don't let lost items stay lost. Start your search or report a found item today!</h1>
        <p></p>
      </main>
    </div>
  );
}