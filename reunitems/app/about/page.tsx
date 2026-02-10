import Image from "next/image";

export default function Home() {
  return (
    <div className="bg-white min-h-screen">
      <main>
        <p> </p>
        <p> </p>
        <h1 className="text-8xl font-bold text-center">Our Team (Hash Browns)</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 mt-8">
          <div className="flex flex-col items-center text-center">
            <Image 
              src="/assets/dristi.png"
              alt="Dristi"
              width={250} 
              height={250}
              className="rounded-lg mb-4"
            />
            <h2 className="text-2xl font-bold">Dristi</h2>
            <p className="text-gray-600 mt-2">Hi! I'm a CS student and researcher at BHS.</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <Image 
              src="/assets/lily.png"
              alt="Lily"
              width={250} 
              height={250}
              className="rounded-lg mb-4"
            />
            <h2 className="text-2xl font-bold">Lily</h2>
            <p className="text-gray-600 mt-2">Hi! I'm a physics and game dev enthusiast</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <Image 
              src="/assets/aimery.png"
              alt="Aimery"
              width={250} 
              height={250}
              className="rounded-lg mb-4"
            />
            <h2 className="text-2xl font-bold">Aimery</h2>
            <p className="text-gray-600 mt-2">Hi! I'm an incoming business major.</p>
          </div>
        </div>
        <h1 className="text-5xl font-bold text-center mt-6">Our Directions</h1>
        <div className="text-2xl mt-4 ml-5 mr-5">
          <p className="font-bold">
          School Lost-and-Found Website
          </p>
          <p>
          Design and code a fully functional lost-and-found website for your school community. The
          site should help students and staff report found items, search for lost belongings, and manage
          the claim process efficiently. Includes:
          </p>
          <ul>
          • A home page with a clear layout and navigation menu
          • A submission form for reporting found items, including the ability to upload photos
          • A searchable listing of all found items
          • A claim/inquiry form for students to request information about or claim a listed item
          • A basic backend system or admin view to review, approve, or manage item postings
          </ul>
          <p>
          Focus on clean design, functionality, and user experience. You must code the website from
          scratch using code of your choice. Use of databases or other backend tools is encouraged to
          enhance functionality
          </p>
        </div>
      </main>
    </div>
  );
}