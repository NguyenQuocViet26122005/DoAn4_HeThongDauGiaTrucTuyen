function docJSON(giaTri, macDinh) {
  if (giaTri == null) {
    return macDinh;
  }

  return typeof giaTri === 'string' ? JSON.parse(giaTri) : giaTri;
}

export { docJSON };
