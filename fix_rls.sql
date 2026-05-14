-- This adds a DELETE policy for the ccmd_evaluations table
-- allowing the Admin to clear the evaluations using the "Remettre à zéro" button.

CREATE POLICY "Admins can delete evaluations" 
  ON ccmd_evaluations FOR DELETE 
  TO authenticated 
  USING (ccmd_is_admin(auth.uid()));
