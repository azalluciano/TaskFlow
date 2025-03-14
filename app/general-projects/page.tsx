"use client";
import React, { useEffect, useState } from "react";
import Wrapper from "../components/Wrapper";
import { SquarePlus } from "lucide-react";
import { toast } from "react-toastify";
import { addUserToProject, getProjectsCreatedByUser } from "../action";
import { useUser } from "@clerk/nextjs";
import { Project } from "@/type";
import ProjectCard from "../components/ProjectCard";
import EmptyState from "../components/EmptyState";

const page = () => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string;
  const [inviteCode, setInviteCode] = useState("");
  const [associatedProjects, setAssociatedProjects] = useState<Project[]>([]);
  const fetcProjects = async (email: string) => {
    try {
      const associated = await getProjectsCreatedByUser(email);
      setAssociatedProjects(associated);
    } catch (error) {
      console.error("Erreur de récupération des projets", error);
    }
  };
  useEffect(() => {
    if (email) {
      fetcProjects(email);
    }
  }, [email]);
  const handleSubmit = async () => {
    try {
      if (inviteCode != "") {
        await addUserToProject(email, inviteCode);
        toast.success("Vous avez rejoint le projet avec succès");
      } else {
        toast.error("Il manque le code d'invitation");
      }
    } catch (error) {
      toast.error(
        "Code d'invitation invalide ou vous avez déjà rejoint le projet"
      );
    }
  };
  return (
    <Wrapper>
      <div className="flex">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Code d'invitation"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="w-full p-2 input input-bordered"
          />
        </div>
        <button className="btn btn-primary ml-4" onClick={handleSubmit}>
          Rejoindre <SquarePlus className="w-4" />
        </button>
      </div>
      <div>
        {associatedProjects.length > 0 ? (
          <ul className="w-full grid md:grid-cols-3 gap-6 ">
            {associatedProjects.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} admin={0} style={true} />
              </li>
            ))}
          </ul>
        ) : (
          <div>
            <EmptyState
              imageSrc="/empty-project.png"
              imageAlt="Picture of an empty project"
              message="Vous n'avez pas encore de projet associé"
            />
          </div>
        )}
      </div>
    </Wrapper>
  );
};

export default page;
