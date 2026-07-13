-- CreateTable
CREATE TABLE "_ParentEnfant" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ParentEnfant_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ParentEnfant_B_index" ON "_ParentEnfant"("B");

-- AddForeignKey
ALTER TABLE "_ParentEnfant" ADD CONSTRAINT "_ParentEnfant_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParentEnfant" ADD CONSTRAINT "_ParentEnfant_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
