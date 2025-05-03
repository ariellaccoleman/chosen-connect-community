
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Professional Profiles",
    description: "Create a comprehensive profile highlighting your skills, experience, and achievements.",
    imagePosition: "right",
    imageSrc: "https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
  },
  {
    title: "Job Board",
    description: "Discover opportunities with organizations that share your values and support for Israel.",
    imagePosition: "left",
    imageSrc: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
  },
  {
    title: "Mentorship Programs",
    description: "Connect with experienced professionals for guidance, advice, and career development.",
    imagePosition: "right",
    imageSrc: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2068&q=80"
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-chosen-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-chosen-navy mb-4">
            Features Designed for Your Success
          </h2>
          <div className="h-1 w-24 gold-gradient mx-auto mb-6 rounded-full"></div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our platform offers powerful tools to help you grow professionally and connect with like-minded individuals.
          </p>
        </div>
        
        {features.map((feature, index) => (
          <div 
            key={index} 
            className={`flex flex-col ${feature.imagePosition === "left" ? "lg:flex-row-reverse" : "lg:flex-row"} items-center mb-24 last:mb-0`}
          >
            <div className="lg:w-1/2 mb-8 lg:mb-0">
              <img 
                src={feature.imageSrc} 
                alt={feature.title} 
                className="rounded-lg shadow-lg w-full h-auto object-cover"
              />
            </div>
            <div className={`lg:w-1/2 ${feature.imagePosition === "left" ? "lg:pr-16" : "lg:pl-16"}`}>
              <h3 className="text-2xl md:text-3xl font-bold font-heading text-chosen-navy mb-4">
                {feature.title}
              </h3>
              <div className="h-1 w-16 gold-gradient mb-6 rounded-full"></div>
              <p className="text-lg text-gray-600 mb-6">
                {feature.description}
              </p>
              <Button className="bg-chosen-blue text-white hover:bg-chosen-navy">
                Learn More
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
