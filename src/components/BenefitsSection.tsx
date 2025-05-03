
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Users, Link, Calendar } from "lucide-react";

const benefits = [
  {
    title: "Exclusive Network",
    description: "Connect with thousands of professionals who share your values and support for Israel.",
    icon: <Users className="h-10 w-10 mb-4 text-chosen-blue" />
  },
  {
    title: "Career Opportunities",
    description: "Access job postings from organizations and companies that align with your values.",
    icon: <Link className="h-10 w-10 mb-4 text-chosen-blue" />
  },
  {
    title: "Global Community",
    description: "Join a worldwide network of professionals spanning industries and continents.",
    icon: <Globe className="h-10 w-10 mb-4 text-chosen-blue" />
  },
  {
    title: "Exclusive Events",
    description: "Participate in networking events, webinars, and conferences tailored to our community.",
    icon: <Calendar className="h-10 w-10 mb-4 text-chosen-blue" />
  }
];

const BenefitsSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-chosen-navy mb-4">
            Why Join Chosen?
          </h2>
          <div className="h-1 w-24 gold-gradient mx-auto mb-6 rounded-full"></div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our platform provides unique advantages for professionals who support Israel and Jewish values.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="border border-gray-100 shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6 flex flex-col items-center text-center">
                {benefit.icon}
                <h3 className="text-xl font-semibold mb-2 text-chosen-navy">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
