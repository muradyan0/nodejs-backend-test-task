function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function fetchFromWBBoxTariffs(apiKey) {
  try {
    const date = new Date();
    const resp = await fetch(
      `https://common-api.wildberries.ru/api/v1/tariffs/box?date=${formatDate(date)}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
      },
    );
    const body = await resp.json();
    if (!resp.ok)
      throw Error(`cannot fetch tarrifs box by date ${date}: ${body.details} `);
    return body.response.data;
  } catch (err) {
    console.log(err);
    return null;
  }
}

module.exports = {
  fetchFromWBBoxTariffs: fetchFromWBBoxTariffs,
};
