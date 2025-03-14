"use client";
import { useEffect, useState } from "react";
import Wrapper from "./components/Wrapper";

import { FolderGit2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "react-toastify";
import {
  createProject,
  deleteProjectsById,
  getProjectsCreatedByUser,
} from "./action";
import { Project } from "@/type";
import ProjectCard from "./components/ProjectCard";
import EmptyState from "./components/EmptyState";

export default function Home() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = async (email: string) => {
    try {
      const myproject = await getProjectsCreatedByUser(email);
      setProjects(myproject);
      console.log("myproject", myproject);
    } catch (error) {
      console.error("Erreur de récupération des projets", error);
    }
  };

  useEffect(() => {
    if (email) {
      fetchProjects(email);
    }
  }, [email]);

  const deleteProject = async (projectId: string) => {
    try {
      await deleteProjectsById(projectId);
      fetchProjects(email);
      toast.success("Projet supprimé avec succès");
    } catch (error) {
      console.error("Erreur de suppression du projet", error);
    }
  };

  const handleSubmit = async () => {
    try {
      const modal = document.getElementById("my_modal_3") as HTMLDialogElement;
      const project = await createProject(name, description, email);
      if (modal) {
        modal.close();
        setName("");
        setDescription("");
        fetchProjects(email);
        toast.success("Projet créé avec succès");
      }
    } catch (error) {
      console.error("Erreur de création du projetc", error);
    }
  };
  return (
    <Wrapper>
      <div>
        {/* You can open the modal using document.getElementById('ID').showModal() method */}
        <button
          className="btn btn-primary mb-6"
          onClick={() =>
            (
              document.getElementById("my_modal_3") as HTMLDialogElement
            ).showModal()
          }
        >
          Nouveau Project <FolderGit2 />
        </button>
        <dialog id="my_modal_3" className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                ✕
              </button>
            </form>
            <h3 className="font-bold text-lg">Nouveau Projet</h3>
            <p className="py-4">
              Décrivez votre projet simplement grâce à description
            </p>
            <div>
              <input
                placeholder="Nom du projet"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-base-300 input input-bordered w-full mb-4 placeholder:text-sm"
                required
              />
              <textarea
                placeholder="Description"
                value={description}
                rows={4}
                onChange={(e) => setDescription(e.target.value)}
                className="mb-2 textarea textarea-bordered border border-base-300 w-full textarea-md placeholder:text-sm"
                required
              ></textarea>
              <button className="btn btn-primary" onClick={handleSubmit}>
                Nouveau Project <FolderGit2 />
              </button>
            </div>
          </div>
        </dialog>
        <div className="w-full">
          {projects.length > 0 ? (
            <ul className="w-full grid md:grid-cols-3 gap-6 ">
              {projects.map((project) => (
                <li key={project.id}>
                  <ProjectCard
                    project={project}
                    admin={1}
                    style={true}
                    onDelete={deleteProject}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <EmptyState
                imageSrc="/empty-project.png"
                imageAlt="Picture of an empty project"
                message="Vous n'avez pas encore de projet"
              />
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
}
