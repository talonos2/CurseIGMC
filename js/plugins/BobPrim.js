/*:
*
*@plugindesc creates minimal spanning trees.  Requires number of nodes, and list of possible connections
*
*
*@author Bob
*
*@help
*
*
* 
*
*
*
*
*/


//console.log("starts");


/*
var numNodes = 9;
var connections = [
        [0, 1],
        [1, 2],
        [3, 4],
        [4, 5],
        [6, 7],
        [7, 8],
        [0, 3],
        [3, 6],
        [1, 4],
        [4, 7],
        [2, 5],
        [5, 8]]
*/






myprim = function(numNodes, connections)
{

    var i;
    var u;

    var start;
    var next;
    var count;
    var neighbors = 0;
    var alone;

    var thiscell;

        var side;
    var sideCells = [];

    var inside = [];
    var outside = [];

    for(i = 0; i < numNodes; i++)   //array storing its own length
    {
        outside[i] = i;
    }


    var final = [];  //bool list to output

    for(i = 0; i < connections.length; i++)
    {
        final[i] = false;
    }


    var outlinks = connections;
    var links = [];
    var frontier = [];

    next =  Math.floor((Math.random() * numNodes));

    inside.push(next);
    outside.splice(outside.indexOf(next), 1);

    for(i = 0; i < outlinks.length; i++)
    {
        if (outlinks[i][0] == next && frontier.indexOf(outlinks[i][1]) == -1)
        {
            frontier.push(outlinks[i][1]);
            outside.splice(outside.indexOf(outlinks[i][1]), 1);
        }
        else if (outlinks[i][1] == next && frontier.indexOf(outlinks[i][0]) == -1)
        {
            frontier.push(outlinks[i][0]);
            outside.splice(outside.indexOf(outlinks[i][0]), 1);
        }
    }



//    console.log("next is " + next);
//    console.log("frontier is " + frontier);

        while(inside.length < numNodes)
{
    next = frontier[Math.floor(Math.random() * frontier.length)];

    inside.push(next);
    frontier.splice(frontier.indexOf(next), 1);

//    console.log("new next is " + next);


    // finds all cells next to 'next' that area already mapped.  checks to see if there is more than one.
    for(i = 0; i < outlinks.length; i++)
    {
        if (outlinks[i][0] ==  next)
        {
            for(u = 0; u < inside.length; u++)
            {
                if (outlinks[i][1] == inside[u])
                {
                    sideCells[neighbors] = [next, inside[u]];
                    neighbors++;
                }
            }


        }
        else if (outlinks[i][1] == next)
        {
            for(u = 0; u < inside.length; u++)
            {
                if (outlinks[i][0] == inside[u])
                {
                    sideCells[neighbors] = [inside[u], next];
                    neighbors++;
                }
            }
        }
    }

//  console.log("neighbors is  " + neighbors);


        if (neighbors > 1)
        side = Math.floor((Math.random() * neighbors));
        else
        side = 0

        neighbors = 0;

    for(i = 0; i < connections.length; i++)
    {
       if (sideCells[side][0] == connections[i][0]  && sideCells[side][1] == connections[i][1])
       {
//          console.log("found it?");
          final[i]=true;
       }
    }

//    console.log("output list so far " + final);


    for(i = 0; i < outlinks.length; i++)
    {
        if (outlinks[i][0] == next && inside.indexOf(outlinks[i][1]) == -1 && frontier.indexOf(outlinks[i][1]) == -1)
        {
            frontier.push(outlinks[i][1]);
            outside.splice(outside.indexOf(outlinks[i][1]), 1);
        }
        else if (outlinks[i][1] == next && inside.indexOf(outlinks[i][0]) == -1 && frontier.indexOf(outlinks[i][0]) == -1)
        {
            frontier.push(outlinks[i][0]);
            outside.splice(outside.indexOf(outlinks[i][0]), 1);
        }
    }

//    console.log("new frontier is " + frontier);
}

 return final;
}
