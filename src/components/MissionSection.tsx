
import { Button } from "@/components/ui/button";

const MissionSection = () => {
  return (
    <section className="py-20 bg-white overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-chosen-blue to-chosen-navy opacity-90"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80')] bg-cover bg-center opacity-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">
            Our Mission
          </h2>
          <div className="h-1 w-24 gold-gradient mx-auto mb-8 rounded-full"></div>
          <p className="text-xl mb-8">
            At Chosen, we believe in fostering a professional community that celebrates Jewish culture and supports Israel. Our mission is to create opportunities for like-minded professionals to connect, collaborate, and thrive in their careers.
          </p>
          <p className="text-xl mb-10">
            Together, we're building a network that empowers professionals while promoting understanding, dialogue, and professional growth.
          </p>
          <Button className="btn-secondary" size="lg">
            Join Our Mission
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
