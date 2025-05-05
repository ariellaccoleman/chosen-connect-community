
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Check, Heart, Users, MessageCircle, Calendar } from 'lucide-react';

const AboutHeader = () => {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-4xl font-bold mb-4">About CHOSEN</h1>
      <p className="text-lg text-muted-foreground">
        Our mission, values, and commitment to the pro-Israel community
      </p>
    </div>
  );
};

const MissionTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Our Mission</CardTitle>
        <CardDescription>Building a stronger community together</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Who We Are</h3>
          <p>
            CHOSEN is a community platform for professionals who love Israel to build and protect
            our community, businesses, and careers through meaningful relationships. Every member has
            a critical role to play, and everyone's contribution is valued.
          </p>
          <p>
            Our success depends on community engagement. This is a place for members to show up
            and be active participants in a trusted and trustworthy community based on shared values.
          </p>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Our Purpose</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Connect Professionals</strong>
                <p className="text-muted-foreground">Creating meaningful networks for pro-Israel and Jewish professionals worldwide.</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Support Career Growth</strong>
                <p className="text-muted-foreground">Providing resources, opportunities, and mentorship within our community.</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Advocate Together</strong>
                <p className="text-muted-foreground">Strengthening our collective voice in professional settings and beyond.</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Build Resilience</strong>
                <p className="text-muted-foreground">Creating a support system that helps our community thrive in challenging times.</p>
              </div>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

const ValuesTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Our Values</CardTitle>
        <CardDescription>What guides our community</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 p-4 border rounded-md">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold">Support</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              We stand by each other professionally and personally, offering guidance and encouragement.
            </p>
          </div>
          
          <div className="space-y-3 p-4 border rounded-md">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">Community</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              We build meaningful connections based on shared values and mutual respect.
            </p>
          </div>
          
          <div className="space-y-3 p-4 border rounded-md">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-violet-500" />
              <h3 className="font-semibold">Open Dialogue</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              We encourage respectful conversation and the free exchange of ideas within our community.
            </p>
          </div>
          
          <div className="space-y-3 p-4 border rounded-md">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              <h3 className="font-semibold">Proactive Engagement</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              We actively participate in community initiatives and support each other's professional growth.
            </p>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Community Guidelines</h3>
          <ul className="space-y-3">
            {['Be respectful and constructive', 'Maintain confidentiality', 'Contribute meaningfully', 'Support Israel and each other'].map((guideline, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>{guideline}</strong>
                  <p className="text-muted-foreground">
                    {index === 0 && 'Approach all interactions with respect, even when opinions differ.'}
                    {index === 1 && 'Keep sensitive information within the community.'}
                    {index === 2 && 'Focus on quality over quantity in your interactions.'}
                    {index === 3 && 'Remember our shared values and purpose as a community.'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

const TeamTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Our Team</CardTitle>
        <CardDescription>The people behind CHOSEN</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <p>
            CHOSEN was founded by a group of passionate professionals committed to building a stronger 
            community for pro-Israel and Jewish individuals in the professional world. Our team combines 
            expertise in community building, technology, and advocacy.
          </p>
          
          <p>
            We are dedicated to creating a platform that not only connects people but also provides 
            valuable resources, opportunities, and support for career development and community engagement.
          </p>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Our Commitment</h3>
          <p>
            As a team, we are committed to:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Continuous Improvement</strong>
                <p className="text-muted-foreground">We regularly update and enhance the platform based on community feedback.</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Community Support</strong>
                <p className="text-muted-foreground">We provide responsive assistance to all members and ensure a positive experience.</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Ethical Leadership</strong>
                <p className="text-muted-foreground">We lead with integrity and transparency in all our operations.</p>
              </div>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

const About = () => {
  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <AboutHeader />

          <Tabs defaultValue="mission" className="space-y-8">
            <TabsList className="grid grid-cols-3 gap-2">
              <TabsTrigger value="mission">Our Mission</TabsTrigger>
              <TabsTrigger value="values">Our Values</TabsTrigger>
              <TabsTrigger value="team">Our Team</TabsTrigger>
            </TabsList>

            <TabsContent value="mission" className="space-y-6">
              <MissionTab />
            </TabsContent>

            <TabsContent value="values" className="space-y-6">
              <ValuesTab />
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <TeamTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default About;
